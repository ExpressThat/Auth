import type {
  Clock,
  CreateSecretRequest,
  DisableSecretRequest,
  ResolvedSecret,
  ResolveSecretRequest,
  RotateSecretRequest,
  SecretMetadata,
  SecretStorageProvider,
  SecretVersionMetadata,
  SecretVersionRequest,
} from "../index.js";
import { SecretMaterial, SecretReference, SecretStorageError, SecretVersion } from "../index.js";

type MutableVersion = {
  material: Uint8Array;
  metadata: {
    createdAt: SecretVersionMetadata["createdAt"];
    disabledAt?: SecretVersionMetadata["disabledAt"];
    reference: SecretVersionMetadata["reference"];
    replacedAt?: SecretVersionMetadata["replacedAt"];
    rotatedFrom?: SecretVersionMetadata["rotatedFrom"];
    state: SecretVersionMetadata["state"];
    version: SecretVersionMetadata["version"];
  };
};

type SecretRecord = {
  createdAt: SecretMetadata["createdAt"];
  disabledAt?: SecretMetadata["disabledAt"];
  lastRotatedAt?: SecretMetadata["lastRotatedAt"];
  purpose: SecretMetadata["purpose"];
  reference: SecretMetadata["reference"];
  versions: MutableVersion[];
};

function versionNumber(version: SecretVersion): number {
  return version.numberValue();
}

function copyVersionMetadata(metadata: MutableVersion["metadata"]): SecretVersionMetadata {
  return {
    createdAt: metadata.createdAt,
    reference: metadata.reference,
    state: metadata.state,
    version: metadata.version,
    ...(metadata.disabledAt === undefined ? {} : { disabledAt: metadata.disabledAt }),
    ...(metadata.replacedAt === undefined ? {} : { replacedAt: metadata.replacedAt }),
    ...(metadata.rotatedFrom === undefined ? {} : { rotatedFrom: metadata.rotatedFrom }),
  };
}

export class TestSecretStorageAdapter implements SecretStorageProvider {
  readonly #clock: Clock;
  readonly #records = new Map<string, SecretRecord>();
  #sequence = 0;

  public constructor(clock: Clock) {
    this.#clock = clock;
  }

  public clearVersionsForTest(reference: SecretReference): void {
    const record = this.#requireRecord(reference, "resolve");
    record.versions.splice(0);
  }

  public async create(request: CreateSecretRequest): Promise<SecretMetadata> {
    const createdAt = this.#clock.now();
    this.#sequence += 1;
    const reference = SecretReference.parse(`test:secret/${String(this.#sequence)}`);
    const record: SecretRecord = {
      createdAt,
      purpose: request.purpose,
      reference,
      versions: [
        {
          material: request.material.copyForProvider(),
          metadata: {
            createdAt,
            reference,
            state: "active",
            version: SecretVersion.parse(1),
          },
        },
      ],
    };
    this.#records.set(reference.opaqueValue(), record);
    return this.#recordMetadata(record);
  }

  public async disable(request: DisableSecretRequest): Promise<SecretMetadata> {
    const record = this.#requireRecord(request.reference, "disable");
    const current = this.#current(record);

    this.#requireExpectedVersion(current, request.expectedCurrentVersion, "disable");
    if (record.disabledAt !== undefined) {
      throw new SecretStorageError("disable", "disabled");
    }
    const disabledAt = this.#clock.now();
    record.disabledAt = disabledAt;
    current.metadata.disabledAt = disabledAt;
    current.metadata.state = "disabled";
    current.material.fill(0);
    return this.#recordMetadata(record);
  }

  public async metadata(request: SecretVersionRequest): Promise<SecretVersionMetadata | undefined> {
    const record = this.#records.get(request.reference.opaqueValue());

    if (!record) {
      return undefined;
    }
    const requestedVersion = request.version;
    const selected = requestedVersion
      ? record.versions.find(
          (candidate) =>
            versionNumber(candidate.metadata.version) === versionNumber(requestedVersion),
        )
      : this.#current(record);
    return selected ? copyVersionMetadata(selected.metadata) : undefined;
  }

  public async resolve(request: ResolveSecretRequest): Promise<ResolvedSecret> {
    const record = this.#requireRecord(request.reference, "resolve");

    if (record.purpose.identifier() !== request.purpose.identifier()) {
      throw new SecretStorageError("resolve", "purpose-mismatch");
    }
    if (record.disabledAt !== undefined) {
      throw new SecretStorageError("resolve", "disabled");
    }
    const requestedVersion = request.version;
    const selected = requestedVersion
      ? record.versions.find(
          (candidate) =>
            versionNumber(candidate.metadata.version) === versionNumber(requestedVersion),
        )
      : this.#current(record);
    if (!selected) {
      throw new SecretStorageError("resolve", "not-found");
    }
    return {
      material: SecretMaterial.fromBytes(selected.material),
      metadata: copyVersionMetadata(selected.metadata),
    };
  }

  public async rotate(request: RotateSecretRequest): Promise<SecretMetadata> {
    const record = this.#requireRecord(request.reference, "rotate");
    const current = this.#current(record);

    this.#requireExpectedVersion(current, request.expectedCurrentVersion, "rotate");
    if (record.disabledAt !== undefined) {
      throw new SecretStorageError("rotate", "disabled");
    }
    const rotatedAt = this.#clock.now();
    const nextVersion = SecretVersion.parse(versionNumber(current.metadata.version) + 1);
    current.metadata.replacedAt = rotatedAt;
    current.metadata.state = "superseded";
    record.lastRotatedAt = rotatedAt;
    record.versions.push({
      material: request.material.copyForProvider(),
      metadata: {
        createdAt: rotatedAt,
        reference: record.reference,
        rotatedFrom: current.metadata.version,
        state: "active",
        version: nextVersion,
      },
    });
    return this.#recordMetadata(record);
  }

  #current(record: SecretRecord): MutableVersion {
    const current = record.versions.at(-1);

    if (!current) {
      throw new Error("Test secret record has no versions.");
    }
    return current;
  }

  #recordMetadata(record: SecretRecord): SecretMetadata {
    return {
      createdAt: record.createdAt,
      currentVersion: this.#current(record).metadata.version,
      purpose: record.purpose,
      reference: record.reference,
      ...(record.disabledAt === undefined ? {} : { disabledAt: record.disabledAt }),
      ...(record.lastRotatedAt === undefined ? {} : { lastRotatedAt: record.lastRotatedAt }),
    };
  }

  #requireExpectedVersion(
    current: MutableVersion,
    expected: SecretVersion,
    operation: "disable" | "rotate",
  ): void {
    if (versionNumber(current.metadata.version) !== versionNumber(expected)) {
      throw new SecretStorageError(operation, "conflict");
    }
  }

  #requireRecord(
    reference: SecretVersionRequest["reference"],
    operation: "disable" | "resolve" | "rotate",
  ): SecretRecord {
    const record = this.#records.get(reference.opaqueValue());

    if (!record) {
      throw new SecretStorageError(operation, "not-found");
    }
    return record;
  }
}

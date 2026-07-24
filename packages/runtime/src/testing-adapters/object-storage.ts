import type {
  Clock,
  DeletedObject,
  DeleteObjectRequest,
  GetObjectRequest,
  ObjectOperation,
  ObjectResidencyMetadata,
  ObjectStorageHealth,
  ObjectStorageProvider,
  PutObjectRequest,
  SignedObjectAccess,
  SignObjectAccessRequest,
  StoredObject,
  StoredObjectMetadata,
} from "../index.js";
import {
  MAX_SIGNED_OBJECT_ACCESS_MILLISECONDS,
  ObjectChecksum,
  ObjectContentLength,
  ObjectStorageError,
  ObjectVersion,
  SignedObjectUrl,
} from "../index.js";
import { TestObjectBackend, type TestStoredObject } from "./object-backend.js";
import { readObjectBody, TestObjectBody } from "./object-body.js";

function equalBytes(left: Uint8Array, right: Uint8Array): boolean {
  return left.every((byte, index) => byte === right[index]);
}

function copyMetadata(metadata: StoredObjectMetadata): StoredObjectMetadata {
  return { ...metadata, classifications: [...metadata.classifications] };
}

export class TestObjectStorageAdapter implements ObjectStorageProvider {
  readonly #backend: TestObjectBackend;
  readonly #clock: Clock;
  readonly #residency: ObjectResidencyMetadata;

  public constructor(
    clock: Clock,
    residency: ObjectResidencyMetadata,
    backend = new TestObjectBackend(),
  ) {
    this.#clock = clock;
    this.#residency = residency;
    this.#backend = backend;
  }

  public async delete(request: DeleteObjectRequest): Promise<DeletedObject> {
    this.#requireAvailable("delete");
    const record = this.#current(request);
    if (!record) {
      throw new ObjectStorageError("delete", "not-found");
    }
    if (record.metadata.version.opaqueValue() !== request.expectedVersion.opaqueValue()) {
      throw new ObjectStorageError("delete", "conflict");
    }
    record.deleted = true;
    return {
      deletedAt: this.#clock.now(),
      key: record.metadata.key,
      version: record.metadata.version,
    };
  }

  public async get(request: GetObjectRequest): Promise<StoredObject | undefined> {
    this.#requireAvailable("get");
    const records = this.#backend.records.get(this.#identity(request));
    const record = request.version
      ? records?.find(
          (candidate) =>
            candidate.metadata.version.opaqueValue() === request.version?.opaqueValue(),
        )
      : records?.findLast((candidate) => !candidate.deleted);
    if (!record || record.deleted || record.metadata.expiresAt.compare(this.#clock.now()) <= 0) {
      return undefined;
    }
    return {
      body: TestObjectBody.fromChunks([record.bytes]),
      metadata: copyMetadata(record.metadata),
    };
  }

  public async health(): Promise<ObjectStorageHealth> {
    return {
      checkedAt: this.#clock.now(),
      status: this.#backend.available
        ? this.#backend.degraded
          ? "degraded"
          : "healthy"
        : "unavailable",
      supportsChecksums: true,
      supportsSignedAccess: true,
      supportsVersioning: true,
    };
  }

  public async put(request: PutObjectRequest): Promise<StoredObjectMetadata> {
    this.#requireAvailable("put");
    this.#validatePut(request);
    const bytes = await readObjectBody(request.body);
    if (bytes.length !== request.contentLength.numberValue()) {
      throw new ObjectStorageError("put", "length-mismatch");
    }
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", Uint8Array.from(bytes).buffer),
    );
    if (!equalBytes(digest, request.checksum.copyDigestForProvider())) {
      throw new ObjectStorageError("put", "checksum-mismatch");
    }
    const identity = this.#identity(request);
    const records = this.#backend.records.get(identity) ?? [];
    const current = records.findLast((candidate) => !candidate.deleted);
    if (
      (!request.expectedVersion && current) ||
      (request.expectedVersion &&
        current?.metadata.version.opaqueValue() !== request.expectedVersion.opaqueValue())
    ) {
      throw new ObjectStorageError("put", "conflict");
    }
    const metadata: StoredObjectMetadata = {
      checksum: ObjectChecksum.sha256(digest),
      classifications: [...request.classifications],
      contentLength: ObjectContentLength.bytes(bytes.length),
      createdAt: this.#clock.now(),
      encryption: request.encryption,
      expiresAt: request.expiresAt,
      key: request.key,
      mediaType: request.mediaType,
      residency: this.#residency,
      scope: request.scope,
      version: ObjectVersion.parse(`test:version/${String(records.length + 1)}`),
    };
    records.push({ bytes: Uint8Array.from(bytes), deleted: false, metadata });
    this.#backend.records.set(identity, records);
    return copyMetadata(metadata);
  }

  public async signAccess(request: SignObjectAccessRequest): Promise<SignedObjectAccess> {
    this.#requireAvailable("sign-access");
    const lifetime = Number(request.accessExpiresAt) - Number(this.#clock.now());
    if (lifetime <= 0 || lifetime > MAX_SIGNED_OBJECT_ACCESS_MILLISECONDS) {
      throw new ObjectStorageError("sign-access", "invalid");
    }
    if (request.action === "read" && !(await this.get(request))) {
      throw new ObjectStorageError("sign-access", "not-found");
    }
    if (request.action === "write") {
      this.#validateSignedWrite(request);
    }
    const identity = encodeURIComponent(this.#identity(request));
    return {
      action: request.action,
      expiresAt: request.accessExpiresAt,
      url: SignedObjectUrl.parse(`https://objects.test/${identity}?signature=synthetic`),
    };
  }

  #current(request: DeleteObjectRequest): TestStoredObject | undefined {
    return this.#backend.records
      .get(this.#identity(request))
      ?.findLast((candidate) => !candidate.deleted);
  }

  #identity(request: Pick<GetObjectRequest, "key" | "scope">): string {
    return `${request.scope.providerNamespace()}|${request.key.providerKey()}`;
  }

  #requireAvailable(operation: ObjectOperation): void {
    if (!this.#backend.available) {
      throw new ObjectStorageError(operation, "unavailable");
    }
  }

  #validatePut(request: PutObjectRequest): void {
    if (
      request.classifications.length < 1 ||
      new Set(request.classifications).size !== request.classifications.length ||
      request.expiresAt.compare(this.#clock.now()) <= 0
    ) {
      throw new ObjectStorageError("put", "invalid");
    }
    if (request.requiredResidency === "eu-only" && this.#residency.policy !== "eu-only") {
      throw new ObjectStorageError("put", "residency-violation");
    }
  }

  #validateSignedWrite(request: Extract<SignObjectAccessRequest, { action: "write" }>): void {
    if (
      request.classifications.length < 1 ||
      new Set(request.classifications).size !== request.classifications.length ||
      request.objectExpiresAt.compare(this.#clock.now()) <= 0
    ) {
      throw new ObjectStorageError("sign-access", "invalid");
    }
    if (request.requiredResidency === "eu-only" && this.#residency.policy !== "eu-only") {
      throw new ObjectStorageError("sign-access", "residency-violation");
    }
  }
}

export { TestObjectBackend } from "./object-backend.js";

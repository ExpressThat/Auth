import { PublicEntityId } from "./identifier.js";

const HOSTNAME_PATTERN =
  /^(?=.{1,253}\.?$)(?!.*\.\.)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?\.?$/u;
const REFERENCE_PATTERN = /^[a-z][a-z0-9]*(?::[a-z][a-z0-9-]*)+\/[A-Za-z0-9._~/-]+$/u;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]+$/u;

export interface ManagedDomainScopeInput {
  readonly applicationId: PublicEntityId<"app">;
  readonly customerOrganisationId: PublicEntityId<"org">;
  readonly environmentId: PublicEntityId<"env">;
}

export class ManagedDomainScope {
  readonly #applicationId: PublicEntityId<"app">;
  readonly #customerOrganisationId: PublicEntityId<"org">;
  readonly #environmentId: PublicEntityId<"env">;

  private constructor(input: ManagedDomainScopeInput) {
    this.#applicationId = input.applicationId;
    this.#customerOrganisationId = input.customerOrganisationId;
    this.#environmentId = input.environmentId;
  }

  public static create(input: ManagedDomainScopeInput): ManagedDomainScope {
    if (
      !(input.applicationId instanceof PublicEntityId) ||
      input.applicationId.prefix !== "app" ||
      !(input.customerOrganisationId instanceof PublicEntityId) ||
      input.customerOrganisationId.prefix !== "org" ||
      !(input.environmentId instanceof PublicEntityId) ||
      input.environmentId.prefix !== "env"
    ) {
      throw new TypeError("Managed domain scope requires a trusted identifier hierarchy.");
    }
    return new ManagedDomainScope(input);
  }

  public providerNamespace(): string {
    return [
      this.#customerOrganisationId.toString(),
      this.#environmentId.toString(),
      this.#applicationId.toString(),
    ]
      .map((value) => `${String(value.length)}:${value}`)
      .join("|");
  }

  public toJSON(): string {
    return "[REDACTED MANAGED DOMAIN SCOPE]";
  }
}

export class ManagedHostname {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): ManagedHostname {
    if (typeof value !== "string") {
      throw new TypeError("Managed hostname must be a normalized public DNS hostname.");
    }
    const normalized = value.toLowerCase().replace(/\.$/u, "");
    if (
      value !== normalized ||
      !HOSTNAME_PATTERN.test(normalized) ||
      normalized.endsWith(".localhost") ||
      normalized.endsWith(".invalid")
    ) {
      throw new TypeError("Managed hostname must be a normalized public DNS hostname.");
    }
    return new ManagedHostname(normalized);
  }

  public equals(other: ManagedHostname): boolean {
    return this.#value === other.#value;
  }

  public value(): string {
    return this.#value;
  }
}

export class DomainAutomationReference {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): DomainAutomationReference {
    if (
      typeof value !== "string" ||
      value.length < 5 ||
      value.length > 300 ||
      !REFERENCE_PATTERN.test(value)
    ) {
      throw new TypeError("Domain automation reference must use the bounded opaque format.");
    }
    return new DomainAutomationReference(value);
  }

  public opaqueValue(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED DOMAIN AUTOMATION REFERENCE]";
  }
}

export class DomainChallengeValue {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): DomainChallengeValue {
    if (
      typeof value !== "string" ||
      value.length < 32 ||
      value.length > 200 ||
      !TOKEN_PATTERN.test(value)
    ) {
      throw new TypeError("Domain challenge must be a bounded base64url value.");
    }
    return new DomainChallengeValue(value);
  }

  public valueForDns(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED DNS CHALLENGE]";
  }
}

export class DnsRecordName {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): DnsRecordName {
    if (
      typeof value !== "string" ||
      value.length > 253 ||
      value !== value.toLowerCase().replace(/\.$/u, "") ||
      !/^(?:_[a-z0-9-]+\.)*(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(
        value,
      )
    ) {
      throw new TypeError("DNS record name must be a normalized bounded name.");
    }
    return new DnsRecordName(value);
  }

  public value(): string {
    return this.#value;
  }
}

export class AutomationRevision {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): AutomationRevision {
    if (!Number.isSafeInteger(value) || Number(value) < 1) {
      throw new TypeError("Automation revision must be a positive safe integer.");
    }
    return new AutomationRevision(Number(value));
  }

  public numberValue(): number {
    return this.#value;
  }
}

abstract class ArtifactString {
  readonly #value: string;

  protected constructor(value: unknown, label: string, pattern: RegExp, maximum: number) {
    if (
      typeof value !== "string" ||
      value.length < 1 ||
      value.length > maximum ||
      !pattern.test(value)
    ) {
      throw new TypeError(`${label} is invalid.`);
    }
    this.#value = value;
  }

  public value(): string {
    return this.#value;
  }
}

export class FrontendArtifactReference extends ArtifactString {
  private constructor(value: unknown) {
    super(value, "Frontend artifact reference", REFERENCE_PATTERN, 500);
  }

  public static parse(value: unknown): FrontendArtifactReference {
    return new FrontendArtifactReference(value);
  }

  public toJSON(): string {
    return "[REDACTED FRONTEND ARTIFACT REFERENCE]";
  }
}

export class FrontendArtifactDigest extends ArtifactString {
  private constructor(value: unknown) {
    super(value, "Frontend artifact digest", /^sha256:[a-f0-9]{64}$/u, 71);
  }

  public static sha256(value: unknown): FrontendArtifactDigest {
    return new FrontendArtifactDigest(value);
  }
}

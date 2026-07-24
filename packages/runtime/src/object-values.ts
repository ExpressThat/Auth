import { PublicEntityId } from "./identifier.js";

export const MAX_OBJECT_CONTENT_LENGTH = 5_497_558_138_880;
export const MAX_SIGNED_OBJECT_ACCESS_MILLISECONDS = 900_000;
const MAX_OBJECT_STRING_LENGTH = 500;

function parseObjectString(value: unknown, label: string, pattern: RegExp): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > MAX_OBJECT_STRING_LENGTH ||
    !pattern.test(value)
  ) {
    throw new TypeError(`${label} must use the bounded format.`);
  }
  return value;
}

export class ObjectKey {
  readonly #value: string;

  private constructor(value: unknown) {
    const parsed = parseObjectString(value, "Object key", /^[A-Za-z0-9._/-]+$/u);
    if (
      parsed.startsWith("/") ||
      parsed.endsWith("/") ||
      parsed.split("/").some((segment) => segment === "." || segment === "..")
    ) {
      throw new TypeError("Object key must not contain path traversal or empty edge segments.");
    }
    this.#value = parsed;
  }

  public static parse(value: unknown): ObjectKey {
    return new ObjectKey(value);
  }

  public providerKey(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED OBJECT KEY]";
  }
}

export class ObjectMediaType {
  readonly #value: string;

  private constructor(value: unknown) {
    this.#value = parseObjectString(
      value,
      "Object media type",
      /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/u,
    );
  }

  public static parse(value: unknown): ObjectMediaType {
    return new ObjectMediaType(value);
  }

  public value(): string {
    return this.#value;
  }
}

export class ObjectVersion {
  readonly #value: string;

  private constructor(value: unknown) {
    this.#value = parseObjectString(value, "Object version", /^[A-Za-z0-9._:/-]+$/u);
  }

  public static parse(value: unknown): ObjectVersion {
    return new ObjectVersion(value);
  }

  public opaqueValue(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED OBJECT VERSION]";
  }
}

export class ObjectRegion {
  readonly #value: string;

  private constructor(value: unknown) {
    this.#value = parseObjectString(value, "Object region", /^[A-Za-z0-9._-]+$/u);
  }

  public static parse(value: unknown): ObjectRegion {
    return new ObjectRegion(value);
  }

  public identifier(): string {
    return this.#value;
  }
}

export class ObjectContentLength {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static bytes(value: unknown): ObjectContentLength {
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < 0 ||
      value > MAX_OBJECT_CONTENT_LENGTH
    ) {
      throw new TypeError("Object content length must be a bounded non-negative safe integer.");
    }
    return new ObjectContentLength(value);
  }

  public numberValue(): number {
    return this.#value;
  }
}

export class ObjectChecksum {
  readonly #digest: Uint8Array;

  private constructor(digest: Uint8Array) {
    this.#digest = Uint8Array.from(digest);
  }

  public static sha256(digest: unknown): ObjectChecksum {
    if (!(digest instanceof Uint8Array) || digest.length !== 32) {
      throw new TypeError("SHA-256 object checksum must contain exactly 32 bytes.");
    }
    return new ObjectChecksum(digest);
  }

  public algorithm(): "sha256" {
    return "sha256";
  }

  public copyDigestForProvider(): Uint8Array {
    return Uint8Array.from(this.#digest);
  }

  public toJSON(): string {
    return "[REDACTED OBJECT CHECKSUM]";
  }
}

export class SignedObjectUrl {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): SignedObjectUrl {
    if (typeof value !== "string" || value.length > 8_192) {
      throw new TypeError("Signed object URL must be a bounded HTTPS URL.");
    }
    const parsed = URL.parse(value);
    if (parsed?.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
      throw new TypeError("Signed object URL must be a bounded HTTPS URL.");
    }
    return new SignedObjectUrl(parsed.toString());
  }

  public valueForClient(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED SIGNED OBJECT URL]";
  }
}

export interface ObjectScopeInput {
  readonly applicationId?: PublicEntityId<"app">;
  readonly customerOrganisationId: PublicEntityId<"org">;
  readonly environmentId?: PublicEntityId<"env">;
}

export class ObjectScope {
  readonly #applicationId: PublicEntityId<"app"> | undefined;
  readonly #customerOrganisationId: PublicEntityId<"org">;
  readonly #environmentId: PublicEntityId<"env"> | undefined;

  private constructor(input: ObjectScopeInput) {
    this.#applicationId = input.applicationId;
    this.#customerOrganisationId = input.customerOrganisationId;
    this.#environmentId = input.environmentId;
  }

  public static create(input: ObjectScopeInput): ObjectScope {
    if (
      !(input.customerOrganisationId instanceof PublicEntityId) ||
      input.customerOrganisationId.prefix !== "org" ||
      (input.environmentId !== undefined &&
        (!(input.environmentId instanceof PublicEntityId) ||
          input.environmentId.prefix !== "env")) ||
      (input.applicationId !== undefined &&
        (!(input.applicationId instanceof PublicEntityId) ||
          input.applicationId.prefix !== "app")) ||
      (input.applicationId !== undefined && input.environmentId === undefined)
    ) {
      throw new TypeError("Object scope must contain a valid trusted identifier hierarchy.");
    }
    return new ObjectScope(input);
  }

  public applicationId(): PublicEntityId<"app"> | undefined {
    return this.#applicationId;
  }

  public customerOrganisationId(): PublicEntityId<"org"> {
    return this.#customerOrganisationId;
  }

  public environmentId(): PublicEntityId<"env"> | undefined {
    return this.#environmentId;
  }

  public providerNamespace(): string {
    const values = [
      this.#customerOrganisationId.toString(),
      this.#environmentId?.toString() ?? "-",
      this.#applicationId?.toString() ?? "-",
    ];
    return values.map((value) => `${String(value.length)}:${value}`).join("|");
  }

  public toJSON(): string {
    return "[REDACTED OBJECT SCOPE]";
  }
}

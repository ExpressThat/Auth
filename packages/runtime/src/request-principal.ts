import { PublicEntityId } from "./identifier.js";

abstract class BrandedOrganisationId {
  readonly #value: PublicEntityId<"org">;

  protected constructor(value: unknown, label: string) {
    if (!(value instanceof PublicEntityId) || value.prefix !== "org") {
      throw new TypeError(`${label} must wrap a validated organisation identifier.`);
    }
    this.#value = value;
  }

  public publicId(): PublicEntityId<"org"> {
    return this.#value;
  }

  public value(): string {
    return this.#value.toString();
  }

  public toJSON(): string {
    return "[REDACTED ORGANISATION ID]";
  }
}

export class ManagementOrganisationId extends BrandedOrganisationId {
  public readonly kind = "management";

  private constructor(value: unknown) {
    super(value, "Management organisation ID");
  }

  public static fromPublicId(value: unknown): ManagementOrganisationId {
    return new ManagementOrganisationId(value);
  }
}

export class CustomerOrganisationId extends BrandedOrganisationId {
  public readonly kind = "customer";

  private constructor(value: unknown) {
    super(value, "Customer organisation ID");
  }

  public static fromPublicId(value: unknown): CustomerOrganisationId {
    return new CustomerOrganisationId(value);
  }
}

export class ServicePrincipalId {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): ServicePrincipalId {
    if (
      typeof value !== "string" ||
      value.length < 3 ||
      value.length > 100 ||
      !/^[a-z][a-z0-9]*(?:[.:/_-][a-z0-9]+)+$/u.test(value)
    ) {
      throw new TypeError("Service principal ID must use the bounded namespaced format.");
    }
    return new ServicePrincipalId(value);
  }

  public value(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED SERVICE PRINCIPAL]";
  }
}

export type PrincipalKind =
  | "anonymous"
  | "application"
  | "end-user"
  | "management-user"
  | "service";
export type PrincipalPlane = "customer" | "management" | "public";

export class PrincipalReference {
  readonly #identifier:
    | PublicEntityId<"app">
    | PublicEntityId<"usr">
    | ServicePrincipalId
    | undefined;
  public readonly kind: PrincipalKind;
  public readonly plane: PrincipalPlane;

  private constructor(
    kind: PrincipalKind,
    plane: PrincipalPlane,
    identifier?: PublicEntityId<"app"> | PublicEntityId<"usr"> | ServicePrincipalId,
  ) {
    this.kind = kind;
    this.plane = plane;
    this.#identifier = identifier;
  }

  public static anonymous(): PrincipalReference {
    return new PrincipalReference("anonymous", "public");
  }

  public static endUser(value: unknown): PrincipalReference {
    return new PrincipalReference("end-user", "customer", requireId(value, "usr"));
  }

  public static managementUser(value: unknown): PrincipalReference {
    return new PrincipalReference("management-user", "management", requireId(value, "usr"));
  }

  public static application(value: unknown): PrincipalReference {
    return new PrincipalReference("application", "customer", requireId(value, "app"));
  }

  public static service(
    value: unknown,
    plane: Exclude<PrincipalPlane, "public">,
  ): PrincipalReference {
    if (!(value instanceof ServicePrincipalId)) {
      throw new TypeError("Service principal requires a validated opaque service ID.");
    }
    return new PrincipalReference("service", plane, value);
  }

  public identifier():
    | PublicEntityId<"app">
    | PublicEntityId<"usr">
    | ServicePrincipalId
    | undefined {
    return this.#identifier;
  }

  public sameIdentity(other: PrincipalReference): boolean {
    return (
      this.kind === other.kind &&
      this.plane === other.plane &&
      identifierValue(this.#identifier) === identifierValue(other.#identifier)
    );
  }

  public toJSON(): string {
    return "[REDACTED PRINCIPAL]";
  }
}

function identifierValue(
  value: PublicEntityId<"app"> | PublicEntityId<"usr"> | ServicePrincipalId | undefined,
): string | undefined {
  return value instanceof ServicePrincipalId ? value.value() : value?.toString();
}

function requireId<TPrefix extends "app" | "usr">(
  value: unknown,
  prefix: TPrefix,
): PublicEntityId<TPrefix> {
  if (!(value instanceof PublicEntityId) || value.prefix !== prefix) {
    throw new TypeError(`Principal must use a validated ${prefix} identifier.`);
  }
  return PublicEntityId.parse(prefix, value.toString());
}

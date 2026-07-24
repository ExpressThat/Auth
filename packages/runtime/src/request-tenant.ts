import { PublicEntityId } from "./identifier.js";
import { CustomerOrganisationId, ManagementOrganisationId } from "./request-principal.js";

export interface ManagementTenantInput {
  readonly activeCustomerOrganisationId?: CustomerOrganisationId;
  readonly applicationId?: PublicEntityId<"app">;
  readonly customerOrganisationId?: CustomerOrganisationId;
  readonly environmentId?: PublicEntityId<"env">;
  readonly managementOrganisationId: ManagementOrganisationId;
}

export interface CustomerTenantInput {
  readonly activeEndUserOrganisationId?: PublicEntityId<"uorg">;
  readonly applicationId: PublicEntityId<"app">;
  readonly customerOrganisationId: CustomerOrganisationId;
  readonly environmentId: PublicEntityId<"env">;
}

type TenantInput =
  | ({ readonly plane: "customer" } & CustomerTenantInput)
  | ({ readonly plane: "management" } & ManagementTenantInput);

export class TrustedTenantContext {
  readonly #input: TenantInput;

  private constructor(input: TenantInput) {
    this.#input = input;
  }

  public static customer(input: CustomerTenantInput): TrustedTenantContext {
    if (!(input.customerOrganisationId instanceof CustomerOrganisationId)) {
      throw new TypeError("Customer tenant requires a branded customer organisation.");
    }
    requirePublicId(input.environmentId, "env");
    requirePublicId(input.applicationId, "app");
    if (input.activeEndUserOrganisationId) {
      requirePublicId(input.activeEndUserOrganisationId, "uorg");
    }
    return new TrustedTenantContext({ ...input, plane: "customer" });
  }

  public static management(input: ManagementTenantInput): TrustedTenantContext {
    if (
      !(input.managementOrganisationId instanceof ManagementOrganisationId) ||
      (input.customerOrganisationId !== undefined &&
        !(input.customerOrganisationId instanceof CustomerOrganisationId)) ||
      (input.activeCustomerOrganisationId !== undefined &&
        !(input.activeCustomerOrganisationId instanceof CustomerOrganisationId))
    ) {
      throw new TypeError("Management tenant requires branded organisation identifiers.");
    }
    const hasCustomer = input.customerOrganisationId !== undefined;
    if (
      (input.environmentId !== undefined && !hasCustomer) ||
      (input.applicationId !== undefined && input.environmentId === undefined) ||
      (input.activeCustomerOrganisationId !== undefined &&
        (!hasCustomer ||
          input.activeCustomerOrganisationId.value() !== input.customerOrganisationId?.value()))
    ) {
      throw new TypeError("Management tenant hierarchy must be complete and consistent.");
    }
    if (input.environmentId) {
      requirePublicId(input.environmentId, "env");
    }
    if (input.applicationId) {
      requirePublicId(input.applicationId, "app");
    }
    return new TrustedTenantContext({ ...input, plane: "management" });
  }

  public activeOrganisationId(): string | undefined {
    return this.#input.plane === "customer"
      ? this.#input.activeEndUserOrganisationId?.toString()
      : this.#input.activeCustomerOrganisationId?.value();
  }

  public applicationId(): PublicEntityId<"app"> | undefined {
    return this.#input.applicationId;
  }

  public customerOrganisationId(): CustomerOrganisationId | undefined {
    return this.#input.customerOrganisationId;
  }

  public environmentId(): PublicEntityId<"env"> | undefined {
    return this.#input.environmentId;
  }

  public managementOrganisationId(): ManagementOrganisationId | undefined {
    return this.#input.plane === "management" ? this.#input.managementOrganisationId : undefined;
  }

  public plane(): "customer" | "management" {
    return this.#input.plane;
  }

  public toJSON(): string {
    return "[REDACTED TRUSTED TENANT CONTEXT]";
  }
}

function requirePublicId<TPrefix extends "app" | "env" | "uorg">(
  value: unknown,
  prefix: TPrefix,
): void {
  if (!(value instanceof PublicEntityId) || value.prefix !== prefix) {
    throw new TypeError(`Tenant context requires a validated ${prefix} identifier.`);
  }
}

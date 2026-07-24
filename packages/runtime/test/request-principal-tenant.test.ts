import { describe, expect, it } from "vitest";
import {
  CustomerOrganisationId,
  EntityId,
  ManagementOrganisationId,
  PrincipalReference,
  PublicEntityId,
  ServicePrincipalId,
  TrustedTenantContext,
} from "../src/index.js";
import { requestFixture } from "./request-test-fixture.js";

describe("request principal and tenant context", () => {
  it("keeps management and customer organisation brands distinct", () => {
    const { customerOrganisationId, managementOrganisationId } = requestFixture();
    expect(customerOrganisationId.value()).not.toBe(managementOrganisationId.value());
    expect(customerOrganisationId.publicId().toString()).toBe(customerOrganisationId.value());
    expect(JSON.stringify(customerOrganisationId)).toBe('"[REDACTED ORGANISATION ID]"');
    expect(() =>
      CustomerOrganisationId.fromPublicId(
        PublicEntityId.create("env", EntityId.parse("01234567-89ab-7001-8203-040506070801")),
      ),
    ).toThrow(TypeError);
    expect(() => ManagementOrganisationId.fromPublicId("org_raw")).toThrow(TypeError);
  });

  it("models anonymous, end-user, management, and service principals", () => {
    const { applicationId, endUser, managementActor } = requestFixture();
    const anonymous = PrincipalReference.anonymous();
    const application = PrincipalReference.application(applicationId);
    const serviceId = ServicePrincipalId.parse("platform/jobs.worker");
    const service = PrincipalReference.service(serviceId, "management");

    expect(anonymous.identifier()).toBeUndefined();
    expect(application.identifier()?.toString()).toBe(applicationId.toString());
    expect(service.identifier()).toBe(serviceId);
    expect(service.sameIdentity(service)).toBe(true);
    expect(endUser.sameIdentity(endUser)).toBe(true);
    expect(endUser.sameIdentity(managementActor)).toBe(false);
    expect(JSON.stringify(endUser)).toBe('"[REDACTED PRINCIPAL]"');
    expect(JSON.stringify(serviceId)).toBe('"[REDACTED SERVICE PRINCIPAL]"');
    expect(() => PrincipalReference.endUser(applicationId)).toThrow(TypeError);
    expect(() => PrincipalReference.application(endUser.identifier())).toThrow(TypeError);
    expect(() => PrincipalReference.service(applicationId, "management")).toThrow(TypeError);
    expect(() => ServicePrincipalId.parse("worker")).toThrow(TypeError);
  });

  it("constructs complete customer context with an optional active organisation", () => {
    const {
      applicationId,
      customerOrganisationId,
      customerTenant,
      endUserOrganisationId,
      environmentId,
    } = requestFixture();
    expect(customerTenant.plane()).toBe("customer");
    expect(customerTenant.customerOrganisationId()).toBe(customerOrganisationId);
    expect(customerTenant.environmentId()).toBe(environmentId);
    expect(customerTenant.applicationId()).toBe(applicationId);
    expect(customerTenant.activeOrganisationId()).toBe(endUserOrganisationId.toString());
    expect(customerTenant.managementOrganisationId()).toBeUndefined();
    expect(JSON.stringify(customerTenant)).toBe('"[REDACTED TRUSTED TENANT CONTEXT]"');
  });

  it("supports protected management scope and a consistent selected hierarchy", () => {
    const { applicationId, customerOrganisationId, environmentId, managementOrganisationId } =
      requestFixture();
    const root = TrustedTenantContext.management({ managementOrganisationId });
    const selected = TrustedTenantContext.management({
      activeCustomerOrganisationId: customerOrganisationId,
      applicationId,
      customerOrganisationId,
      environmentId,
      managementOrganisationId,
    });

    expect(root.customerOrganisationId()).toBeUndefined();
    expect(selected.activeOrganisationId()).toBe(customerOrganisationId.value());
    expect(selected.managementOrganisationId()).toBe(managementOrganisationId);
    expect(selected.plane()).toBe("management");
  });

  it("rejects incomplete or inconsistent management hierarchy", () => {
    const { applicationId, customerOrganisationId, environmentId, managementOrganisationId } =
      requestFixture();
    const otherCustomer = CustomerOrganisationId.fromPublicId(
      PublicEntityId.create("org", EntityId.parse("01234567-89ab-7001-8203-040506070899")),
    );
    expect(() =>
      TrustedTenantContext.management({ environmentId, managementOrganisationId }),
    ).toThrow(TypeError);
    expect(() =>
      TrustedTenantContext.management({
        applicationId,
        customerOrganisationId,
        managementOrganisationId,
      }),
    ).toThrow(TypeError);
    expect(() =>
      TrustedTenantContext.management({
        activeCustomerOrganisationId: otherCustomer,
        customerOrganisationId,
        managementOrganisationId,
      }),
    ).toThrow(TypeError);
    expect(() =>
      TrustedTenantContext.management({
        // @ts-expect-error -- exercise runtime organisation-brand validation.
        managementOrganisationId: customerOrganisationId,
      }),
    ).toThrow(TypeError);
  });

  it("rejects forged customer brands and confused identifier dimensions", () => {
    const {
      applicationId,
      customerOrganisationId,
      endUserOrganisationId,
      environmentId,
      managementOrganisationId,
    } = requestFixture();
    expect(() =>
      TrustedTenantContext.customer({
        applicationId,
        // @ts-expect-error -- exercise runtime organisation-brand validation.
        customerOrganisationId: managementOrganisationId,
        environmentId,
      }),
    ).toThrow(TypeError);
    expect(() =>
      TrustedTenantContext.customer({
        // @ts-expect-error -- exercise runtime identifier-prefix validation.
        applicationId: environmentId,
        customerOrganisationId,
        environmentId,
      }),
    ).toThrow(TypeError);
    expect(() =>
      TrustedTenantContext.customer({
        // @ts-expect-error -- exercise runtime identifier-prefix validation.
        activeEndUserOrganisationId: applicationId,
        applicationId,
        customerOrganisationId,
        environmentId,
      }),
    ).toThrow(TypeError);
    expect(() =>
      TrustedTenantContext.customer({
        applicationId,
        customerOrganisationId,
        // @ts-expect-error -- exercise runtime identifier-prefix validation.
        environmentId: endUserOrganisationId,
      }),
    ).toThrow(TypeError);
  });
});

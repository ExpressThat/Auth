import { describe, expect, it } from "vitest";
import {
  AssuranceContext,
  EpochMilliseconds,
  NoImpersonationContext,
  PrincipalReference,
  RequestAction,
  RequestContext,
  TrustedTenantContext,
} from "../src/index.js";
import { activeImpersonation, normalRequest, requestFixture } from "./request-test-fixture.js";

describe("immutable request context", () => {
  it("exposes one redacting trusted context for a normal customer request", () => {
    const request = normalRequest();
    const fixture = requestFixture();

    expect(request.action().value()).toBe("profile:read");
    expect(request.actor().sameIdentity(fixture.endUser)).toBe(true);
    expect(request.subject().sameIdentity(fixture.endUser)).toBe(true);
    expect(request.assurance().level()).toBe("aal2");
    expect(request.correlationId().value()).toBe(fixture.correlationId.value());
    expect(request.requestId().value()).toBe(fixture.requestId.value());
    expect(Number(request.receivedAt())).toBe(1_000);
    expect(request.tenant().plane()).toBe("customer");
    expect(request.network().address.valueForSecurityUse()).toBe(
      fixture.network.address.valueForSecurityUse(),
    );
    expect(request.impersonation()).toBeInstanceOf(NoImpersonationContext);
    expect(JSON.stringify(request)).toBe('"[REDACTED REQUEST CONTEXT]"');
  });

  it("allows anonymous entry only with anonymous assurance in customer context", () => {
    const fixture = requestFixture();
    const anonymous = PrincipalReference.anonymous();
    const request = RequestContext.create({
      action: RequestAction.parse("authorization:start"),
      actor: anonymous,
      assurance: AssuranceContext.create({ level: "anonymous", methods: [] }),
      correlationId: fixture.correlationId,
      impersonation: new NoImpersonationContext(),
      network: fixture.network,
      receivedAt: EpochMilliseconds.parse(1_000),
      requestId: fixture.requestId,
      subject: anonymous,
      tenant: fixture.customerTenant,
    });
    expect(request.actor().kind).toBe("anonymous");

    expect(() =>
      RequestContext.create({
        ...baseRequest(fixture),
        actor: anonymous,
        subject: anonymous,
      }),
    ).toThrow(TypeError);
  });

  it("allows a management actor only in management context without impersonation", () => {
    const fixture = requestFixture();
    const managementTenant = TrustedTenantContext.management({
      customerOrganisationId: fixture.customerOrganisationId,
      managementOrganisationId: fixture.managementOrganisationId,
    });
    const request = RequestContext.create({
      ...baseRequest(fixture),
      actor: fixture.managementActor,
      subject: fixture.managementActor,
      tenant: managementTenant,
    });
    expect(request.tenant().plane()).toBe("management");

    expect(() =>
      RequestContext.create({
        ...baseRequest(fixture),
        actor: fixture.managementActor,
        subject: fixture.managementActor,
      }),
    ).toThrow(TypeError);
  });

  it("preserves actor and subject only for matching active impersonation", () => {
    const fixture = activeImpersonation();
    const request = RequestContext.create({
      action: fixture.action,
      actor: fixture.managementActor,
      assurance: fixture.assurance,
      correlationId: fixture.correlationId,
      impersonation: fixture.impersonation,
      network: fixture.network,
      receivedAt: EpochMilliseconds.parse(1_000),
      requestId: fixture.requestId,
      subject: fixture.endUser,
      tenant: fixture.customerTenant,
    });
    expect(request.actor().kind).toBe("management-user");
    expect(request.subject().kind).toBe("end-user");

    expect(() =>
      RequestContext.create({
        ...baseRequest(fixture),
        actor: fixture.managementActor,
        impersonation: fixture.impersonation,
        receivedAt: EpochMilliseconds.parse(1_500),
        subject: fixture.endUser,
      }),
    ).toThrow(TypeError);
    expect(() =>
      RequestContext.create({
        ...baseRequest(fixture),
        action: RequestAction.parse("profile:update"),
        actor: fixture.managementActor,
        impersonation: fixture.impersonation,
        subject: fixture.endUser,
      }),
    ).toThrow(TypeError);
  });

  it("rejects actor/subject divergence without explicit impersonation", () => {
    const fixture = requestFixture();
    expect(() =>
      RequestContext.create({
        ...baseRequest(fixture),
        actor: fixture.managementActor,
        subject: fixture.endUser,
      }),
    ).toThrow(TypeError);
    expect(() =>
      RequestContext.create({
        ...baseRequest(fixture),
        // @ts-expect-error -- exercise forged context value rejection.
        action: "profile:read",
      }),
    ).toThrow(TypeError);
  });
});

function baseRequest(fixture: ReturnType<typeof requestFixture>) {
  return {
    action: fixture.action,
    actor: fixture.endUser,
    assurance: fixture.assurance,
    correlationId: fixture.correlationId,
    impersonation: new NoImpersonationContext(),
    network: fixture.network,
    receivedAt: EpochMilliseconds.parse(1_000),
    requestId: fixture.requestId,
    subject: fixture.endUser,
    tenant: fixture.customerTenant,
  };
}

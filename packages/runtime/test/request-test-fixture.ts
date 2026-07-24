import {
  ActiveImpersonationContext,
  AssuranceContext,
  CorrelationId,
  CustomerOrganisationId,
  EntityId,
  EpochMilliseconds,
  ImpersonationGrantId,
  ImpersonationSessionId,
  ManagementOrganisationId,
  NetworkAddress,
  NetworkContext,
  NetworkFingerprint,
  NoImpersonationContext,
  PrincipalReference,
  PublicEntityId,
  RequestAction,
  RequestContext,
  TrustedTenantContext,
} from "../src/index.js";

const entity = (suffix: string) => EntityId.parse(`01234567-89ab-7001-8203-${suffix}`);

export function requestFixture() {
  const managementOrganisationId = ManagementOrganisationId.fromPublicId(
    PublicEntityId.create("org", entity("040506070801")),
  );
  const customerOrganisationId = CustomerOrganisationId.fromPublicId(
    PublicEntityId.create("org", entity("040506070802")),
  );
  const environmentId = PublicEntityId.create("env", entity("040506070803"));
  const applicationId = PublicEntityId.create("app", entity("040506070804"));
  const endUserOrganisationId = PublicEntityId.create("uorg", entity("040506070805"));
  const managementActor = PrincipalReference.managementUser(
    PublicEntityId.create("usr", entity("040506070806")),
  );
  const endUser = PrincipalReference.endUser(PublicEntityId.create("usr", entity("040506070807")));
  const customerTenant = TrustedTenantContext.customer({
    activeEndUserOrganisationId: endUserOrganisationId,
    applicationId,
    customerOrganisationId,
    environmentId,
  });
  const assurance = AssuranceContext.create({
    authenticatedAt: EpochMilliseconds.parse(900),
    level: "aal2",
    methods: ["passkey"],
    stepUpExpiresAt: EpochMilliseconds.parse(1_500),
  });
  const network = NetworkContext.create({
    address: NetworkAddress.parse("192.0.2.10"),
    source: "trusted-proxy",
    userAgentFingerprint: NetworkFingerprint.fromDigestPrefix(new Uint8Array(16).fill(1)),
  });
  const requestId = CorrelationId.fromEntityId(entity("040506070808"));
  const correlationId = CorrelationId.fromEntityId(entity("040506070809"));
  const action = RequestAction.parse("profile:read");
  return {
    action,
    applicationId,
    assurance,
    correlationId,
    customerOrganisationId,
    customerTenant,
    endUser,
    endUserOrganisationId,
    environmentId,
    managementActor,
    managementOrganisationId,
    network,
    requestId,
  };
}

export function activeImpersonation() {
  const fixture = requestFixture();
  const impersonation = ActiveImpersonationContext.create({
    actions: [fixture.action],
    actor: fixture.managementActor,
    expiresAt: EpochMilliseconds.parse(1_500),
    grantId: ImpersonationGrantId.parse("test:impersonation/grant-0001"),
    sessionId: ImpersonationSessionId.parse("test:impersonation/session-001"),
    startedAt: EpochMilliseconds.parse(900),
    subject: fixture.endUser,
  });
  return { ...fixture, impersonation };
}

export function normalRequest(): RequestContext {
  const fixture = requestFixture();
  return RequestContext.create({
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
  });
}

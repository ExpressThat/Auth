import {
  AutomationRevision,
  DnsRecordName,
  DomainAutomationReference,
  DomainChallengeValue,
  EpochMilliseconds,
  FrontendArtifactDigest,
  FrontendArtifactReference,
  ManagedDomainScope,
  ManagedHostname,
  PublicEntityId,
} from "../src/index.js";
import { ControlledClock } from "../src/testing.js";

function entity<TPrefix extends "app" | "env" | "org">(
  prefix: TPrefix,
  suffix: string,
): PublicEntityId<TPrefix> {
  return PublicEntityId.parse(prefix, `${prefix}_01234567-89ab-7001-8203-${suffix}`);
}

export function managedScope(organisationSuffix = "040506070801"): ManagedDomainScope {
  return ManagedDomainScope.create({
    applicationId: entity("app", "040506070803"),
    customerOrganisationId: entity("org", organisationSuffix),
    environmentId: entity("env", "040506070802"),
  });
}

export function managedDomainFixture() {
  return {
    artifactDigest: FrontendArtifactDigest.sha256(`sha256:${"a".repeat(64)}`),
    artifactReference: FrontendArtifactReference.parse("object:artifact/frontend-v1"),
    certificateReference: DomainAutomationReference.parse("test:certificate/cert-1"),
    challenge: DomainChallengeValue.parse("a".repeat(32)),
    challengeExpiresAt: EpochMilliseconds.parse(2_000),
    challengeRecord: DnsRecordName.parse("_auth.login.example.com"),
    clock: new ControlledClock(1_000),
    dnsReference: DomainAutomationReference.parse("test:dns/record-1"),
    hostname: ManagedHostname.parse("login.example.com"),
    revision: AutomationRevision.parse(1),
    routingTarget: ManagedHostname.parse("edge.example.net"),
    scope: managedScope(),
  };
}

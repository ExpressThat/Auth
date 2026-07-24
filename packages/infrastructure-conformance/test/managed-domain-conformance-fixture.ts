import {
  DomainAutomationReference,
  DomainChallengeValue,
  EpochMilliseconds,
  FrontendArtifactDigest,
  FrontendArtifactReference,
  ManagedDomainScope,
  PublicEntityId,
} from "@expressthat-auth/runtime";
import { ControlledClock } from "@expressthat-auth/runtime/testing";

export function managedScope(organisationSuffix = "040506070801"): ManagedDomainScope {
  const entity = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
    PublicEntityId.parse(prefix, `${prefix}_01234567-89ab-7001-8203-${suffix}`);
  return ManagedDomainScope.create({
    applicationId: entity("app", "040506070803"),
    customerOrganisationId: entity("org", organisationSuffix),
    environmentId: entity("env", "040506070802"),
  });
}

export function domainValues() {
  return {
    artifactDigest: FrontendArtifactDigest.sha256(`sha256:${"a".repeat(64)}`),
    artifactReference: FrontendArtifactReference.parse("object:artifact/frontend-v1"),
    certificateReference: DomainAutomationReference.parse("test:certificate/cert-1"),
    challenge: DomainChallengeValue.parse("a".repeat(32)),
    clock: new ControlledClock(1_000),
    dnsReference: DomainAutomationReference.parse("test:dns/record-1"),
    expiresAt: EpochMilliseconds.parse(10_000),
    scope: managedScope(),
  };
}

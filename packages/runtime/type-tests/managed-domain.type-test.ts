import {
  type CertificateAutomationProvider,
  type DnsAutomationProvider,
  type FrontendDeploymentProvider,
  ManagedDomainScope,
  ManagedHostname,
  PublicEntityId,
} from "@expressthat-auth/runtime";

export declare const certificates: CertificateAutomationProvider;
export declare const deployments: FrontendDeploymentProvider;
export declare const dns: DnsAutomationProvider;
export const hostname = ManagedHostname.parse("login.example.com");

const uuid = "01234567-89ab-7001-8203-040506070809";
ManagedDomainScope.create({
  // @ts-expect-error -- an end-user identity cannot become an application scope.
  applicationId: PublicEntityId.parse("usr", `usr_${uuid}`),
  customerOrganisationId: PublicEntityId.parse("org", `org_${uuid}`),
  environmentId: PublicEntityId.parse("env", `env_${uuid}`),
});

// @ts-expect-error -- DNS operations require validated domain value objects.
dns.prepare({ hostname: "login.example.com" });
// @ts-expect-error -- certificate mutation requires scope, reference, and revision.
certificates.renew({ expectedRevision: 1 });
// @ts-expect-error -- deployment integrity uses a validated SHA-256 digest.
deployments.deploy({ artifactDigest: "sha256:untrusted" });

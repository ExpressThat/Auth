import { describe, expect, it } from "vitest";
import {
  AutomationRevision,
  DnsRecordName,
  DomainAutomationReference,
  DomainChallengeValue,
  FrontendArtifactDigest,
  FrontendArtifactReference,
  ManagedDomainScope,
  ManagedHostname,
  PublicEntityId,
} from "../src/index.js";
import { managedScope } from "./managed-domain-test-fixture.js";

const uuid = "01234567-89ab-7001-8203-040506070809";

describe("managed domain values", () => {
  it("creates a redacting collision-safe tenant scope", () => {
    const scope = managedScope();

    expect(scope.providerNamespace()).toMatch(/^40:org_.+\|40:env_.+\|40:app_/u);
    expect(scope.toJSON()).toBe("[REDACTED MANAGED DOMAIN SCOPE]");
    expect(managedScope("040506070899").providerNamespace()).not.toBe(scope.providerNamespace());
  });

  it.each([
    ["applicationId", PublicEntityId.parse("usr", `usr_${uuid}`)],
    ["customerOrganisationId", PublicEntityId.parse("env", `env_${uuid}`)],
    ["environmentId", PublicEntityId.parse("app", `app_${uuid}`)],
    ["applicationId", {}],
    ["customerOrganisationId", {}],
    ["environmentId", {}],
  ] as const)("rejects an untrusted %s", (property, value) => {
    const valid = {
      applicationId: PublicEntityId.parse("app", `app_${uuid}`),
      customerOrganisationId: PublicEntityId.parse("org", `org_${uuid}`),
      environmentId: PublicEntityId.parse("env", `env_${uuid}`),
    };
    Object.assign(valid, { [property]: value });

    expect(() => ManagedDomainScope.create(valid)).toThrow("trusted identifier hierarchy");
  });

  it("normalizes only already-canonical public hostnames", () => {
    const hostname = ManagedHostname.parse("login.example.com");

    expect(hostname.value()).toBe("login.example.com");
    expect(hostname.equals(ManagedHostname.parse("login.example.com"))).toBe(true);
    expect(hostname.equals(ManagedHostname.parse("other.example.com"))).toBe(false);
    for (const invalid of [
      1,
      "LOGIN.example.com",
      "login.example.com.",
      "single-label",
      "bad..example.com",
      "login.localhost",
      "login.invalid",
    ]) {
      expect(() => ManagedHostname.parse(invalid)).toThrow("normalized public DNS hostname");
    }
  });

  it("validates opaque automation references and redacts serialization", () => {
    const reference = DomainAutomationReference.parse("test:dns/record-1");

    expect(reference.opaqueValue()).toBe("test:dns/record-1");
    expect(reference.toJSON()).toBe("[REDACTED DOMAIN AUTOMATION REFERENCE]");
    for (const invalid of [1, "a:b", `test:dns/${"a".repeat(300)}`, "https://example.com"]) {
      expect(() => DomainAutomationReference.parse(invalid)).toThrow("bounded opaque format");
    }
  });

  it("validates and redacts DNS ownership challenges", () => {
    const challenge = DomainChallengeValue.parse("a_".repeat(16));

    expect(challenge.valueForDns()).toBe("a_".repeat(16));
    expect(challenge.toJSON()).toBe("[REDACTED DNS CHALLENGE]");
    for (const invalid of [1, "short", "a".repeat(201), `${"a".repeat(31)}!`]) {
      expect(() => DomainChallengeValue.parse(invalid)).toThrow("bounded base64url");
    }
  });

  it("validates DNS record names", () => {
    expect(DnsRecordName.parse("_auth.login.example.com").value()).toBe("_auth.login.example.com");
    for (const invalid of [
      1,
      `${"a".repeat(254)}.com`,
      "_AUTH.login.example.com",
      "_auth.single",
    ]) {
      expect(() => DnsRecordName.parse(invalid)).toThrow("normalized bounded name");
    }
  });

  it("validates optimistic automation revisions", () => {
    expect(AutomationRevision.parse(1).numberValue()).toBe(1);
    for (const invalid of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1"]) {
      expect(() => AutomationRevision.parse(invalid)).toThrow("positive safe integer");
    }
  });

  it("validates immutable artifact references and SHA-256 digests", () => {
    const artifactReference = FrontendArtifactReference.parse("object:artifact/frontend-v1");
    expect(artifactReference.value()).toBe("object:artifact/frontend-v1");
    expect(artifactReference.toJSON()).toBe("[REDACTED FRONTEND ARTIFACT REFERENCE]");
    expect(FrontendArtifactDigest.sha256(`sha256:${"a".repeat(64)}`).value()).toBe(
      `sha256:${"a".repeat(64)}`,
    );
    for (const invalid of [1, "", "https://example.com/file", `object:item/${"a".repeat(500)}`]) {
      expect(() => FrontendArtifactReference.parse(invalid)).toThrow(
        "Frontend artifact reference is invalid",
      );
    }
    for (const invalid of [1, "", `sha256:${"A".repeat(64)}`, `sha256:${"a".repeat(63)}`]) {
      expect(() => FrontendArtifactDigest.sha256(invalid)).toThrow(
        "Frontend artifact digest is invalid",
      );
    }
  });
});

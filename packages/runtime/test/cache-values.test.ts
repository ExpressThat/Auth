import { describe, expect, it } from "vitest";
import {
  CacheKey,
  CachePolicyVersion,
  CachePurpose,
  CacheScope,
  CacheValue,
  CacheVersion,
  EntityId,
  MAX_CACHE_VALUE_BYTES,
  PublicEntityId,
} from "../src/index.js";

const uuid = (suffix: string) => EntityId.parse(`01234567-89ab-7001-8203-${suffix}`);
const organisationId = PublicEntityId.create("org", uuid("040506070801"));
const environmentId = PublicEntityId.create("env", uuid("040506070802"));
const applicationId = PublicEntityId.create("app", uuid("040506070803"));

function scope(overrides: Partial<Parameters<typeof CacheScope.create>[0]> = {}) {
  return CacheScope.create({
    applicationId,
    customerOrganisationId: organisationId,
    environmentId,
    policyVersion: CachePolicyVersion.parse(1),
    purpose: CachePurpose.parse("rate-limit.login"),
    ...overrides,
  });
}

describe("cache value objects", () => {
  it("builds collision-resistant, redacting, tenant-scoped provider keys", () => {
    const key = CacheKey.create(scope(), "ip/192.0.2.1");
    const otherEnvironment = CacheKey.create(
      scope({ environmentId: PublicEntityId.create("env", uuid("040506070804")) }),
      "ip/192.0.2.1",
    );
    const withoutApplication = CacheKey.create(
      CacheScope.create({
        customerOrganisationId: organisationId,
        environmentId,
        policyVersion: CachePolicyVersion.parse(1),
        purpose: CachePurpose.parse("rate-limit.login"),
      }),
      "ip/192.0.2.1",
    );

    expect(key.providerKey()).not.toBe(otherEnvironment.providerKey());
    expect(key.providerKey()).not.toBe(withoutApplication.providerKey());
    expect(JSON.stringify({ key, scope: scope() })).toBe(
      '{"key":"[REDACTED CACHE KEY]","scope":"[REDACTED CACHE SCOPE]"}',
    );
  });

  it("validates purpose, policy version, key, and entry version boundaries", () => {
    expect(CachePurpose.parse("a").identifier()).toBe("a");
    expect(CachePolicyVersion.parse(1).numberValue()).toBe(1);
    expect(CacheVersion.parse(1).numberValue()).toBe(1);
    expect(() => CachePurpose.parse("contains spaces")).toThrow(TypeError);
    expect(() => CachePurpose.parse("x".repeat(201))).toThrow(TypeError);
    expect(() => CachePurpose.parse(3)).toThrow(TypeError);
    expect(() => CacheKey.create(scope(), "")).toThrow(TypeError);
    expect(() => CachePolicyVersion.parse(0)).toThrow(TypeError);
    expect(() => CachePolicyVersion.parse(1.5)).toThrow(TypeError);
    expect(() => CachePolicyVersion.parse("1")).toThrow(TypeError);
    expect(() => CacheVersion.parse(0)).toThrow(TypeError);
    expect(() => CacheVersion.parse(1.5)).toThrow(TypeError);
    expect(() => CacheVersion.parse("1")).toThrow(TypeError);
  });

  it("rejects forged or trust-plane-confused scope components at runtime", () => {
    const create = (input: Parameters<typeof CacheScope.create>[0]) => CacheScope.create(input);
    const valid = {
      applicationId,
      customerOrganisationId: organisationId,
      environmentId,
      policyVersion: CachePolicyVersion.parse(1),
      purpose: CachePurpose.parse("session"),
    };

    expect(() =>
      create({
        ...valid,
        // @ts-expect-error -- exercise runtime trust-plane validation.
        customerOrganisationId: PublicEntityId.create("env", uuid("040506070804")),
      }),
    ).toThrow(TypeError);
    expect(() =>
      create({
        ...valid,
        // @ts-expect-error -- exercise runtime trust-plane validation.
        environmentId: PublicEntityId.create("org", uuid("040506070804")),
      }),
    ).toThrow(TypeError);
    expect(() =>
      create({
        ...valid,
        // @ts-expect-error -- exercise runtime trust-plane validation.
        applicationId: PublicEntityId.create("env", uuid("040506070804")),
      }),
    ).toThrow(TypeError);
    expect(() =>
      create({
        ...valid,
        // @ts-expect-error -- exercise runtime value-object validation.
        purpose: "session",
      }),
    ).toThrow(TypeError);
    expect(() =>
      create({
        ...valid,
        // @ts-expect-error -- exercise runtime value-object validation.
        policyVersion: 1,
      }),
    ).toThrow(TypeError);
    expect(() =>
      create({
        ...valid,
        // @ts-expect-error -- exercise runtime forged-object validation.
        customerOrganisationId: {
          prefix: "org",
          toString: () => organisationId.toString(),
        },
      }),
    ).toThrow(TypeError);
  });

  it("copies bounded values defensively and redacts serialization", () => {
    const source = new Uint8Array([1, 2, 3]);
    const value = CacheValue.fromBytes(source);
    source[0] = 9;
    const copy = value.copyForProvider();
    copy[1] = 9;

    expect([...value.copyForProvider()]).toEqual([1, 2, 3]);
    expect(value.byteLength()).toBe(3);
    expect(JSON.stringify(value)).toBe('"[REDACTED CACHE VALUE]"');
    expect(CacheValue.fromBytes(new Uint8Array(MAX_CACHE_VALUE_BYTES)).byteLength()).toBe(
      MAX_CACHE_VALUE_BYTES,
    );
    expect(() => CacheValue.fromBytes(new Uint8Array())).toThrow(TypeError);
    expect(() => CacheValue.fromBytes(new Uint8Array(MAX_CACHE_VALUE_BYTES + 1))).toThrow(
      TypeError,
    );
    expect(() => CacheValue.fromBytes("secret")).toThrow(TypeError);
  });
});

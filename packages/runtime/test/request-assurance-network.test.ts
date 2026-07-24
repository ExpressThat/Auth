import { describe, expect, it } from "vitest";
import {
  AssuranceContext,
  EpochMilliseconds,
  NetworkAddress,
  NetworkContext,
  NetworkFingerprint,
} from "../src/index.js";

describe("request assurance and network context", () => {
  it("models anonymous and ranked authenticated assurance defensively", () => {
    const anonymous = AssuranceContext.create({ level: "anonymous", methods: [] });
    const methods = ["password", "totp"] as const;
    const assurance = AssuranceContext.create({
      authenticatedAt: EpochMilliseconds.parse(900),
      level: "aal2",
      methods,
      stepUpExpiresAt: EpochMilliseconds.parse(1_500),
    });
    const copied = assurance.methods();

    expect(anonymous.satisfies("aal1")).toBe(false);
    expect(assurance.satisfies("aal1")).toBe(true);
    expect(assurance.satisfies("aal3")).toBe(false);
    expect(assurance.authenticatedAt()).toEqual(EpochMilliseconds.parse(900));
    expect(assurance.stepUpExpiresAt()).toEqual(EpochMilliseconds.parse(1_500));
    expect(copied).not.toBe(methods);
    expect(JSON.stringify(assurance)).toBe('"[REDACTED ASSURANCE CONTEXT]"');
  });

  it("rejects incomplete, duplicate, unknown, or backwards assurance", () => {
    expect(() =>
      AssuranceContext.create({
        authenticatedAt: EpochMilliseconds.parse(1),
        level: "anonymous",
        methods: [],
      }),
    ).toThrow(TypeError);
    expect(() => AssuranceContext.create({ level: "aal1", methods: [] })).toThrow(TypeError);
    expect(() =>
      AssuranceContext.create({
        authenticatedAt: EpochMilliseconds.parse(1),
        level: "aal1",
        methods: ["password", "password"],
      }),
    ).toThrow(TypeError);
    expect(() =>
      AssuranceContext.create({
        authenticatedAt: EpochMilliseconds.parse(2),
        level: "aal2",
        methods: ["passkey"],
        stepUpExpiresAt: EpochMilliseconds.parse(2),
      }),
    ).toThrow(TypeError);
    expect(() =>
      AssuranceContext.create({
        authenticatedAt: EpochMilliseconds.parse(1),
        // @ts-expect-error -- exercise runtime level validation.
        level: "aal4",
        methods: ["passkey"],
      }),
    ).toThrow(TypeError);
  });

  it("accepts IPv4 and IPv6 but rejects hostnames and malformed addresses", () => {
    expect(NetworkAddress.parse("192.0.2.1").valueForSecurityUse()).toBe("192.0.2.1");
    expect(NetworkAddress.parse("2001:DB8::1").valueForSecurityUse()).toBe("2001:db8::1");
    expect(JSON.stringify(NetworkAddress.parse("192.0.2.1"))).toBe('"[REDACTED NETWORK ADDRESS]"');
    expect(() => NetworkAddress.parse("256.0.0.1")).toThrow(TypeError);
    expect(() => NetworkAddress.parse("01.2.3.4")).toThrow(TypeError);
    expect(() => NetworkAddress.parse("example.test")).toThrow(TypeError);
    expect(() => NetworkAddress.parse(1)).toThrow(TypeError);
  });

  it("stores only minimized redacting network metadata", () => {
    const fingerprint = NetworkFingerprint.fromDigestPrefix(new Uint8Array(16).fill(1));
    const context = NetworkContext.create({
      address: NetworkAddress.parse("192.0.2.1"),
      source: "direct",
      userAgentFingerprint: fingerprint,
    });
    expect(fingerprint.value()).toHaveLength(32);
    expect(context.userAgentFingerprint).toBe(fingerprint);
    expect(JSON.stringify(context)).toBe('"[REDACTED NETWORK CONTEXT]"');
    expect(() => NetworkFingerprint.fromDigestPrefix(new Uint8Array(15))).toThrow(TypeError);
    expect(() =>
      NetworkContext.create({
        // @ts-expect-error -- exercise forged network metadata rejection.
        address: "192.0.2.1",
        source: "direct",
      }),
    ).toThrow(TypeError);
  });
});

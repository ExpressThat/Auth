import { describe, expect, it } from "vitest";
import { RUNTIME_DEPENDENCY_CAPABILITIES, validateCapabilityComposition } from "../src/index.js";
import {
  createTestRuntimeCapabilityComposition,
  requireEcPublicMembers,
  requireRsaPublicMembers,
  TEST_RUNTIME_CAPABILITY_MANIFEST,
} from "../src/testing.js";

describe("testing-only adapter boundary", () => {
  it("declares only test-profile ephemeral or stateless capabilities", () => {
    const composition = createTestRuntimeCapabilityComposition();

    expect(TEST_RUNTIME_CAPABILITY_MANIFEST.profiles).toEqual(["test"]);
    expect(
      TEST_RUNTIME_CAPABILITY_MANIFEST.declarationFor(
        RUNTIME_DEPENDENCY_CAPABILITIES.passwordHashing,
      ),
    ).toBeUndefined();
    expect(
      TEST_RUNTIME_CAPABILITY_MANIFEST.declarationFor(RUNTIME_DEPENDENCY_CAPABILITIES.signing)
        ?.state,
    ).toEqual({ kind: "stateless" });
    expect(
      TEST_RUNTIME_CAPABILITY_MANIFEST.declarationFor(RUNTIME_DEPENDENCY_CAPABILITIES.cacheState)
        ?.state,
    ).toEqual({
      coordination: "process",
      durability: "ephemeral",
      kind: "stateful",
    });
    expect(composition.manifestFor(RUNTIME_DEPENDENCY_CAPABILITIES.objectStorage)).toBe(
      TEST_RUNTIME_CAPABILITY_MANIFEST,
    );
  });

  it.each(["local-development", "self-hosted", "hosted"] as const)(
    "cannot validate the testing manifest for the %s profile",
    (profile) => {
      const capability = RUNTIME_DEPENDENCY_CAPABILITIES.cacheState;
      expect(() =>
        validateCapabilityComposition({
          bindings: [{ capability, manifest: TEST_RUNTIME_CAPABILITY_MANIFEST }],
          profile,
          requirements: [{ capability, residency: "operator-defined", state: "any" }],
          runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
        }),
      ).toThrow(expect.objectContaining({ code: "profile-incompatible" }));
    },
  );

  it("rejects incomplete generated signing-key metadata", () => {
    expect(() => requireRsaPublicMembers({ n: "modulus" })).toThrow("RSA key lacks public members");
    expect(() => requireRsaPublicMembers({ e: "AQAB" })).toThrow("RSA key lacks public members");
    expect(() => requireEcPublicMembers({ x: "x-coordinate" })).toThrow(
      "EC key lacks public members",
    );
    expect(() => requireEcPublicMembers({ y: "y-coordinate" })).toThrow(
      "EC key lacks public members",
    );
  });
});

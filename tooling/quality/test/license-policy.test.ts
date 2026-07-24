import { describe, expect, it } from "vitest";
import { decodeLicenseInventory, findLicenseViolations } from "../src/license-policy.js";

function inventory(license: string, name: string, versions: string[] = ["1.0.0"]): string {
  return JSON.stringify({
    [license]: [{ license, name, versions }],
  });
}

describe("dependency licence policy", () => {
  it.each([
    "Apache-2.0",
    "BlueOak-1.0.0",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "CC0-1.0",
    "ISC",
    "MIT",
    "MIT OR Apache-2.0",
    "MIT-0",
  ])("allows the reviewed permissive licence %s", (license) => {
    expect(findLicenseViolations(inventory(license, "dependency"))).toEqual([]);
  });

  it.each([
    ["MPL-2.0", "@axe-core/playwright", "4.12.1"],
    ["MPL-2.0", "axe-core", "4.12.1"],
    ["MPL-2.0", "lightningcss", "1.33.0"],
    ["MPL-2.0", "lightningcss-linux-x64-gnu", "1.33.0"],
    ["LGPL-3.0-or-later", "@img/sharp-libvips-linux-x64", "1.3.1"],
    ["Apache-2.0 AND LGPL-3.0-or-later", "@img/sharp-linux-x64", "0.35.2"],
  ])("allows reviewed package exception %s for %s@%s", (license, name, version) => {
    expect(findLicenseViolations(inventory(license, name, [version]))).toEqual([]);
  });

  it("rejects disallowed, unreviewed, and changed versions", () => {
    expect(findLicenseViolations(inventory("GPL-3.0", "copyleft", ["2.0.0"]))).toEqual([
      {
        license: "GPL-3.0",
        package: "copyleft",
        reason: "licence is neither allowed nor a reviewed versioned exception",
        version: "2.0.0",
      },
    ]);
    expect(findLicenseViolations(inventory("MPL-2.0", "axe-core", ["5.0.0"]))).toHaveLength(1);
    expect(
      findLicenseViolations(
        inventory("Apache-2.0 AND LGPL-3.0-or-later", "@img/not-sharp", ["0.35.2"]),
      ),
    ).toHaveLength(1);
    expect(
      findLicenseViolations(
        inventory("LGPL-3.0-or-later", "@img/sharp-libvips-linux-x64", ["2.0.0"]),
      ),
    ).toHaveLength(1);
  });

  it("reports mismatched inventory grouping before licence allowlisting", () => {
    const source = JSON.stringify({
      MIT: [{ license: "ISC", name: "mismatch", versions: ["2.0.0", "1.0.0"] }],
    });

    expect(findLicenseViolations(source)).toEqual([
      {
        license: "ISC",
        package: "mismatch",
        reason: "inventory group is MIT",
        version: "1.0.0",
      },
      {
        license: "ISC",
        package: "mismatch",
        reason: "inventory group is MIT",
        version: "2.0.0",
      },
    ]);
  });

  it("rejects malformed JSON and invalid inventory structures", () => {
    expect(() => decodeLicenseInventory("{")).toThrow();
    expect(() => decodeLicenseInventory('{"MIT":[{"name":""}]}')).toThrow();
  });
});

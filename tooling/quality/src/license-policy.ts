import { z } from "zod";

const packageSchema = z.object({
  license: z.string().min(1),
  name: z.string().min(1),
  versions: z.array(z.string().min(1)).min(1),
});
const inventorySchema = z.record(z.string().min(1), z.array(packageSchema));

export type LicenseViolation = {
  license: string;
  package: string;
  reason: string;
  version: string;
};

const ALLOWED_LICENSES = new Set([
  "Apache-2.0",
  "BlueOak-1.0.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "ISC",
  "MIT",
  "MIT OR Apache-2.0",
  "MIT-0",
]);

function isReviewedException(name: string, version: string, license: string): boolean {
  if (
    license === "MPL-2.0" &&
    version === "4.12.1" &&
    (name === "@axe-core/playwright" || name === "axe-core")
  ) {
    return true;
  }
  if (
    license === "MPL-2.0" &&
    version === "1.33.0" &&
    (name === "lightningcss" || name.startsWith("lightningcss-"))
  ) {
    return true;
  }
  if (
    license === "LGPL-3.0-or-later" &&
    version === "1.3.1" &&
    name.startsWith("@img/sharp-libvips-")
  ) {
    return true;
  }
  return (
    license === "Apache-2.0 AND LGPL-3.0-or-later" &&
    version === "0.35.2" &&
    name.startsWith("@img/sharp-")
  );
}

export function decodeLicenseInventory(source: string): z.infer<typeof inventorySchema> {
  // biome-ignore lint/plugin: The parsed value is immediately validated by the inventory schema.
  const untrustedInventory: unknown = JSON.parse(source);
  return inventorySchema.parse(untrustedInventory);
}

export function findLicenseViolations(source: string): LicenseViolation[] {
  const inventory = decodeLicenseInventory(source);
  const violations: LicenseViolation[] = [];

  for (const [groupLicense, packages] of Object.entries(inventory)) {
    for (const dependency of packages) {
      for (const version of dependency.versions) {
        let reason: string | undefined;
        if (dependency.license !== groupLicense) {
          reason = `inventory group is ${groupLicense}`;
        } else if (
          !ALLOWED_LICENSES.has(dependency.license) &&
          !isReviewedException(dependency.name, version, dependency.license)
        ) {
          reason = "licence is neither allowed nor a reviewed versioned exception";
        }

        if (reason !== undefined) {
          violations.push({
            license: dependency.license,
            package: dependency.name,
            reason,
            version,
          });
        }
      }
    }
  }

  return violations.sort(
    (left, right) =>
      left.package.localeCompare(right.package) || left.version.localeCompare(right.version),
  );
}

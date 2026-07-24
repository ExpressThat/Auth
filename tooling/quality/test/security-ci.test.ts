import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const WORKFLOW = new URL("../../../.github/workflows/security-ci.yml", import.meta.url);
const CONFIG = new URL("../../../.gitleaks.toml", import.meta.url);

describe("security CI workflow", () => {
  it("uses a complete read-only checkout and locked dependencies", async () => {
    const workflow = await readFile(WORKFLOW, "utf8");

    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("fetch-depth: 0");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
  });

  it("runs dependency, licence, and generated-artifact gates", async () => {
    const workflow = await readFile(WORKFLOW, "utf8");

    expect(workflow).toContain("pnpm scan:dependencies");
    expect(workflow).toContain("pnpm scan:licenses");
    expect(workflow).toContain("pnpm scan:artifacts");
  });

  it("verifies a pinned scanner and emits redacted review output", async () => {
    const workflow = await readFile(WORKFLOW, "utf8");
    const checksum = [
      // biome-ignore lint/security/noSecrets: This is a public release archive checksum.
      "551f6fc83ea457d62a0d98237cbad105",
      // biome-ignore lint/security/noSecrets: This is a public release archive checksum.
      "af8d557003051f41f3e7ca7b3f2470eb",
    ].join("");

    expect(workflow).toContain("GITLEAKS_VERSION: 8.30.1");
    expect(workflow).toContain(`GITLEAKS_SHA256: ${checksum}`);
    expect(workflow).toContain("sha256sum --check");
    expect(workflow).toContain("--redact");
    expect(workflow).toContain("--report-format sarif");
    expect(workflow).toContain("--verbose");
  });

  it("extends maintained secret rules without blanket allowlists", async () => {
    const config = await readFile(CONFIG, "utf8");

    expect(config).toContain("useDefault = true");
    expect(config).not.toContain("allowlist");
  });
});

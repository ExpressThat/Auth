import { describe, expect, it } from "vitest";
import { EpochMilliseconds, ObjectChecksum, ObjectContentLength, ObjectKey } from "../src/index.js";
import { readObjectBody } from "./object-test-body.js";
import { objectFixture, objectWrite } from "./object-test-fixture.js";

describe("object storage contract", () => {
  it("streams, verifies, stores, and defensively retrieves classified content", async () => {
    const { adapter, residency, scope } = objectFixture();
    const request = await objectWrite(scope);
    const metadata = await adapter.put(request);
    const stored = await adapter.get({ key: request.key, scope });
    const bytes = stored ? await readObjectBody(stored.body) : undefined;
    if (bytes) {
      bytes[0] = 0;
    }
    const reread = await adapter.get({ key: request.key, scope });

    expect(metadata.contentLength.numberValue()).toBe(11);
    expect(metadata.residency).toBe(residency);
    expect(new TextDecoder().decode(stored ? await readObjectBody(stored.body) : undefined)).toBe(
      "object-body",
    );
    expect(new TextDecoder().decode(reread ? await readObjectBody(reread.body) : undefined)).toBe(
      "object-body",
    );
    expect(stored?.metadata.classifications).not.toBe(request.classifications);
  });

  it("uses create-only and optimistic version conditions", async () => {
    const { adapter, scope } = objectFixture();
    const firstRequest = await objectWrite(scope);
    const first = await adapter.put(firstRequest);
    await expect(adapter.put(firstRequest)).rejects.toMatchObject({ code: "conflict" });

    const second = await adapter.put(await objectWrite(scope, { expectedVersion: first.version }));
    expect(second.version.opaqueValue()).not.toBe(first.version.opaqueValue());
    await expect(
      adapter.put(await objectWrite(scope, { expectedVersion: first.version })),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      adapter.get({ key: firstRequest.key, scope, version: first.version }),
    ).resolves.toMatchObject({ metadata: { version: first.version } });
  });

  it("rejects length and checksum mismatches before committing", async () => {
    const { adapter, scope } = objectFixture();
    await expect(
      adapter.put(
        await objectWrite(scope, {
          contentLength: ObjectContentLength.bytes(1),
        }),
      ),
    ).rejects.toMatchObject({ code: "length-mismatch" });
    await expect(
      adapter.put(
        await objectWrite(scope, {
          checksum: ObjectChecksum.sha256(new Uint8Array(32)),
          key: ObjectKey.parse("exports/checksum.zip"),
        }),
      ),
    ).rejects.toMatchObject({ code: "checksum-mismatch" });
  });

  it("expires objects at the exact retention deadline", async () => {
    const { adapter, clock, scope } = objectFixture();
    const request = await objectWrite(scope, {
      expiresAt: EpochMilliseconds.parse(1_001),
    });
    await adapter.put(request);
    clock.advance(1);

    await expect(adapter.get({ key: request.key, scope })).resolves.toBeUndefined();
  });
});

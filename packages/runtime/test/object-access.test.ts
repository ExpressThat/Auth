import { describe, expect, it } from "vitest";
import {
  EpochMilliseconds,
  MAX_SIGNED_OBJECT_ACCESS_MILLISECONDS,
  ObjectKey,
  ObjectScope,
  ObjectVersion,
} from "../src/index.js";
import { objectFixture, objectSignedWrite, objectWrite } from "./object-test-fixture.js";

describe("object deletion and signed access", () => {
  it("deletes only the current optimistic version", async () => {
    const { adapter, scope } = objectFixture();
    const request = await objectWrite(scope);
    const metadata = await adapter.put(request);
    await expect(
      adapter.delete({
        expectedVersion: ObjectVersion.parse("test:version/99"),
        key: request.key,
        scope,
      }),
    ).rejects.toMatchObject({ code: "conflict" });
    const deleted = await adapter.delete({
      expectedVersion: metadata.version,
      key: request.key,
      scope,
    });

    expect(Number(deleted.deletedAt)).toBe(1_000);
    await expect(adapter.get({ key: request.key, scope })).resolves.toBeUndefined();
    await expect(
      adapter.delete({
        expectedVersion: metadata.version,
        key: request.key,
        scope,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("keeps identical object keys isolated by trusted scope", async () => {
    const { adapter, scope } = objectFixture();
    const managementScope = ObjectScope.create({
      customerOrganisationId: scope.customerOrganisationId(),
    });
    const request = await objectWrite(scope);
    await adapter.put(request);

    await expect(
      adapter.get({ key: request.key, scope: managementScope }),
    ).resolves.toBeUndefined();
  });

  it("creates short-lived redacting read and write bearer URLs", async () => {
    const { adapter, scope } = objectFixture();
    const request = await objectWrite(scope);
    await adapter.put(request);
    const read = await adapter.signAccess({
      accessExpiresAt: EpochMilliseconds.parse(1_000 + MAX_SIGNED_OBJECT_ACCESS_MILLISECONDS),
      action: "read",
      key: request.key,
      scope,
    });
    const write = await adapter.signAccess(
      await objectSignedWrite(scope, EpochMilliseconds.parse(2_000)),
    );

    expect(read.url.valueForClient()).toContain("signature=synthetic");
    expect(JSON.stringify(read.url)).toBe('"[REDACTED SIGNED OBJECT URL]"');
    expect(write.action).toBe("write");
    await expect(
      adapter.signAccess({
        accessExpiresAt: EpochMilliseconds.parse(2_000),
        action: "read",
        key: ObjectKey.parse("missing"),
        scope,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects expired or overlong signed access", async () => {
    const { adapter, scope } = objectFixture();
    await expect(
      adapter.signAccess(await objectSignedWrite(scope, EpochMilliseconds.parse(1_000))),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.signAccess(
        await objectSignedWrite(
          scope,
          EpochMilliseconds.parse(1_001 + MAX_SIGNED_OBJECT_ACCESS_MILLISECONDS),
        ),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
  });
});

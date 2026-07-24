import { describe, expect, it } from "vitest";
import {
  EntityId,
  MAX_OBJECT_CONTENT_LENGTH,
  ObjectChecksum,
  ObjectContentLength,
  ObjectKey,
  ObjectMediaType,
  ObjectRegion,
  ObjectScope,
  ObjectVersion,
  PublicEntityId,
  SignedObjectUrl,
} from "../src/index.js";

const id = EntityId.parse("01234567-89ab-7001-8203-040506070801");
const org = PublicEntityId.create("org", id);
const env = PublicEntityId.create("env", id);
const app = PublicEntityId.create("app", id);

describe("object storage values", () => {
  it("validates bounded keys, media types, versions, regions, and lengths", () => {
    expect(ObjectKey.parse("exports/file.zip").providerKey()).toBe("exports/file.zip");
    expect(ObjectMediaType.parse("application/zip").value()).toBe("application/zip");
    expect(ObjectVersion.parse("version/one").opaqueValue()).toBe("version/one");
    expect(ObjectRegion.parse("eu-west-1").identifier()).toBe("eu-west-1");
    expect(ObjectContentLength.bytes(0).numberValue()).toBe(0);
    expect(ObjectContentLength.bytes(MAX_OBJECT_CONTENT_LENGTH).numberValue()).toBe(
      MAX_OBJECT_CONTENT_LENGTH,
    );
    expect(() => ObjectKey.parse("../escape")).toThrow(TypeError);
    expect(() => ObjectKey.parse("contains spaces")).toThrow(TypeError);
    expect(() => ObjectKey.parse("x".repeat(501))).toThrow(TypeError);
    expect(() => ObjectKey.parse(1)).toThrow(TypeError);
    expect(() => ObjectMediaType.parse("not-a-type")).toThrow(TypeError);
    expect(() => ObjectContentLength.bytes(-1)).toThrow(TypeError);
    expect(() => ObjectContentLength.bytes(1.5)).toThrow(TypeError);
    expect(() => ObjectContentLength.bytes("1")).toThrow(TypeError);
    expect(() => ObjectContentLength.bytes(MAX_OBJECT_CONTENT_LENGTH + 1)).toThrow(TypeError);
  });

  it("defensively copies and redacts SHA-256 checksums", () => {
    const source = new Uint8Array(32);
    source[0] = 1;
    const checksum = ObjectChecksum.sha256(source);
    source[0] = 9;
    const copy = checksum.copyDigestForProvider();
    copy[1] = 9;

    expect(checksum.algorithm()).toBe("sha256");
    expect([...checksum.copyDigestForProvider()].slice(0, 2)).toEqual([1, 0]);
    expect(JSON.stringify(checksum)).toBe('"[REDACTED OBJECT CHECKSUM]"');
    expect(() => ObjectChecksum.sha256(new Uint8Array(31))).toThrow(TypeError);
    expect(() => ObjectChecksum.sha256("digest")).toThrow(TypeError);
  });

  it("accepts only bounded credential-free HTTPS signed URLs and redacts them", () => {
    const url = SignedObjectUrl.parse("https://objects.example/file?signature=secret");
    expect(url.valueForClient()).toContain("signature=secret");
    expect(JSON.stringify(url)).toBe('"[REDACTED SIGNED OBJECT URL]"');
    expect(() => SignedObjectUrl.parse("http://objects.example/file")).toThrow(TypeError);
    expect(() => SignedObjectUrl.parse("https://synthetic-user@objects.example/file")).toThrow(
      TypeError,
    );
    expect(() => SignedObjectUrl.parse("not-a-url")).toThrow(TypeError);
    expect(() => SignedObjectUrl.parse("x".repeat(8_193))).toThrow(TypeError);
    expect(() => SignedObjectUrl.parse(1)).toThrow(TypeError);
  });

  it("enforces a trusted organisation, environment, and application hierarchy", () => {
    const scope = ObjectScope.create({
      applicationId: app,
      customerOrganisationId: org,
      environmentId: env,
    });
    const management = ObjectScope.create({ customerOrganisationId: org });

    expect(scope.applicationId()).toBe(app);
    expect(scope.customerOrganisationId()).toBe(org);
    expect(scope.environmentId()).toBe(env);
    expect(management.applicationId()).toBeUndefined();
    expect(management.environmentId()).toBeUndefined();
    expect(scope.providerNamespace()).not.toBe(management.providerNamespace());
    expect(JSON.stringify(scope)).toBe('"[REDACTED OBJECT SCOPE]"');
    expect(JSON.stringify(ObjectKey.parse("private/key"))).toBe('"[REDACTED OBJECT KEY]"');
    expect(JSON.stringify(ObjectVersion.parse("private/version"))).toBe(
      '"[REDACTED OBJECT VERSION]"',
    );
    expect(() => ObjectScope.create({ applicationId: app, customerOrganisationId: org })).toThrow(
      TypeError,
    );
    expect(() =>
      ObjectScope.create({
        // @ts-expect-error -- exercise runtime trust-plane validation.
        customerOrganisationId: env,
      }),
    ).toThrow(TypeError);
  });
});

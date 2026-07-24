import type { PutObjectRequest, SignObjectWriteAccessRequest } from "../src/index.js";
import {
  EntityId,
  EpochMilliseconds,
  ObjectChecksum,
  ObjectContentLength,
  ObjectKey,
  ObjectMediaType,
  ObjectRegion,
  ObjectScope,
  PublicEntityId,
} from "../src/index.js";
import { ControlledClock, TestObjectBody, TestObjectStorageAdapter } from "../src/testing.js";

const id = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
  PublicEntityId.create(prefix, EntityId.parse(`01234567-89ab-7001-8203-${suffix}`));

export function objectFixture(policy: "eu-only" | "operator-managed" = "eu-only") {
  const clock = new ControlledClock(1_000);
  const residency = {
    policy,
    processingRegion: ObjectRegion.parse(policy === "eu-only" ? "eu-west" : "custom"),
    storageRegion: ObjectRegion.parse(policy === "eu-only" ? "eu-west" : "custom"),
    ...(policy === "eu-only" ? { verifiedAt: EpochMilliseconds.parse(900) } : {}),
  } as const;
  const adapter = new TestObjectStorageAdapter(clock, residency);
  const scope = ObjectScope.create({
    applicationId: id("app", "040506070803"),
    customerOrganisationId: id("org", "040506070801"),
    environmentId: id("env", "040506070802"),
  });
  return { adapter, clock, residency, scope };
}

export async function objectWrite(
  scope: ObjectScope,
  overrides: Partial<PutObjectRequest> = {},
): Promise<PutObjectRequest> {
  const bytes = new TextEncoder().encode("object-body");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return {
    body: TestObjectBody.fromChunks([bytes.slice(0, 4), bytes.slice(4)]),
    checksum: ObjectChecksum.sha256(digest),
    classifications: ["personal"],
    contentLength: ObjectContentLength.bytes(bytes.length),
    encryption: "application-envelope",
    expiresAt: EpochMilliseconds.parse(2_000),
    key: ObjectKey.parse("exports/one.zip"),
    mediaType: ObjectMediaType.parse("application/zip"),
    requiredResidency: "eu-only",
    scope,
    ...overrides,
  };
}

export async function objectSignedWrite(
  scope: ObjectScope,
  accessExpiresAt: EpochMilliseconds,
  overrides: Partial<SignObjectWriteAccessRequest> = {},
): Promise<SignObjectWriteAccessRequest> {
  const request = await objectWrite(scope, { key: ObjectKey.parse("imports/new.zip") });
  return {
    accessExpiresAt,
    action: "write",
    checksum: request.checksum,
    classifications: request.classifications,
    contentLength: request.contentLength,
    encryption: request.encryption,
    key: request.key,
    mediaType: request.mediaType,
    objectExpiresAt: request.expiresAt,
    requiredResidency: request.requiredResidency,
    scope,
    ...overrides,
  };
}

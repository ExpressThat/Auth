import type { DataClassification } from "./data-classification.js";
import type {
  ObjectChecksum,
  ObjectContentLength,
  ObjectKey,
  ObjectMediaType,
  ObjectRegion,
  ObjectScope,
  ObjectVersion,
  SignedObjectUrl,
} from "./object-values.js";
import type { EpochMilliseconds } from "./time.js";

export type ObjectEncryptionMode = "application-envelope" | "provider-managed";
export type ObjectResidencyPolicy = "eu-only" | "operator-managed";
export type ObjectSignedAction = "read" | "write";
export type ObjectHealthStatus = "degraded" | "healthy" | "unavailable";
export type ObjectOperation = "delete" | "get" | "health" | "put" | "sign-access";
export type ObjectStorageErrorCode =
  | "checksum-mismatch"
  | "conflict"
  | "expired"
  | "invalid"
  | "length-mismatch"
  | "not-found"
  | "residency-violation"
  | "unavailable"
  | "unsupported";

export interface ObjectBody {
  read(): AsyncIterable<Uint8Array>;
}

export interface ObjectResidencyMetadata {
  readonly policy: ObjectResidencyPolicy;
  readonly processingRegion: ObjectRegion;
  readonly storageRegion: ObjectRegion;
  readonly verifiedAt?: EpochMilliseconds;
}

export interface StoredObjectMetadata {
  readonly checksum: ObjectChecksum;
  readonly classifications: readonly DataClassification[];
  readonly contentLength: ObjectContentLength;
  readonly createdAt: EpochMilliseconds;
  readonly encryption: ObjectEncryptionMode;
  readonly expiresAt: EpochMilliseconds;
  readonly key: ObjectKey;
  readonly mediaType: ObjectMediaType;
  readonly residency: ObjectResidencyMetadata;
  readonly scope: ObjectScope;
  readonly version: ObjectVersion;
}

export interface PutObjectRequest {
  readonly body: ObjectBody;
  readonly checksum: ObjectChecksum;
  readonly classifications: readonly DataClassification[];
  readonly contentLength: ObjectContentLength;
  readonly encryption: ObjectEncryptionMode;
  readonly expectedVersion?: ObjectVersion;
  readonly expiresAt: EpochMilliseconds;
  readonly key: ObjectKey;
  readonly mediaType: ObjectMediaType;
  readonly requiredResidency: ObjectResidencyPolicy;
  readonly scope: ObjectScope;
}

export interface GetObjectRequest {
  readonly key: ObjectKey;
  readonly scope: ObjectScope;
  readonly version?: ObjectVersion;
}

export interface StoredObject {
  readonly body: ObjectBody;
  readonly metadata: StoredObjectMetadata;
}

export interface DeleteObjectRequest {
  readonly expectedVersion: ObjectVersion;
  readonly key: ObjectKey;
  readonly scope: ObjectScope;
}

export interface DeletedObject {
  readonly deletedAt: EpochMilliseconds;
  readonly key: ObjectKey;
  readonly version: ObjectVersion;
}

interface SignObjectAccessRequestBase {
  readonly accessExpiresAt: EpochMilliseconds;
  readonly key: ObjectKey;
  readonly scope: ObjectScope;
}

export interface SignObjectReadAccessRequest
  extends SignObjectAccessRequestBase,
    Pick<GetObjectRequest, "version"> {
  readonly action: "read";
}

export interface SignObjectWriteAccessRequest extends SignObjectAccessRequestBase {
  readonly action: "write";
  readonly checksum: ObjectChecksum;
  readonly classifications: readonly DataClassification[];
  readonly contentLength: ObjectContentLength;
  readonly encryption: ObjectEncryptionMode;
  readonly expectedVersion?: ObjectVersion;
  readonly mediaType: ObjectMediaType;
  readonly objectExpiresAt: EpochMilliseconds;
  readonly requiredResidency: ObjectResidencyPolicy;
}

export type SignObjectAccessRequest = SignObjectReadAccessRequest | SignObjectWriteAccessRequest;

export interface SignedObjectAccess {
  readonly action: ObjectSignedAction;
  readonly expiresAt: EpochMilliseconds;
  readonly url: SignedObjectUrl;
}

export interface ObjectStorageHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly status: ObjectHealthStatus;
  readonly supportsChecksums: boolean;
  readonly supportsSignedAccess: boolean;
  readonly supportsVersioning: boolean;
}

export interface ObjectStorageProvider {
  delete(request: DeleteObjectRequest): Promise<DeletedObject>;
  get(request: GetObjectRequest): Promise<StoredObject | undefined>;
  health(): Promise<ObjectStorageHealth>;
  put(request: PutObjectRequest): Promise<StoredObjectMetadata>;
  signAccess(request: SignObjectAccessRequest): Promise<SignedObjectAccess>;
}

export class ObjectStorageError extends Error {
  public readonly code: ObjectStorageErrorCode;
  public readonly operation: ObjectOperation;
  public readonly retryable: boolean;

  public constructor(operation: ObjectOperation, code: ObjectStorageErrorCode) {
    super(`Object storage ${operation} failed (${code}).`);
    this.name = "ObjectStorageError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: ObjectStorageErrorCode;
    operation: ObjectOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}

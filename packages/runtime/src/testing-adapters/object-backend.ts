import type { StoredObjectMetadata } from "../index.js";

export type TestStoredObject = {
  bytes: Uint8Array;
  deleted: boolean;
  metadata: StoredObjectMetadata;
};

export class TestObjectBackend {
  public readonly records = new Map<string, TestStoredObject[]>();
  public available = true;
  public degraded = false;
}

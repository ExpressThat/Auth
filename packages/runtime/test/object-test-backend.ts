import type { StoredObjectMetadata } from "../src/index.js";

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

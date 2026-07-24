import type {
  ReplicaIdentity,
  ReplicaStateCategory,
  ReplicaStateProbe,
  ReplicaStateProbes,
} from "../src/replica-state-harness.js";

type StoredValue = boolean | number | string;
export type ReplicaBackend = Map<ReplicaStateCategory, Map<string, StoredValue>>;

class MemoryReplica {
  readonly #backend: ReplicaBackend;

  public constructor(backend: ReplicaBackend) {
    this.#backend = backend;
  }

  public claim(category: ReplicaStateCategory, key: string): boolean {
    const bucket = this.#bucket(category);
    if (bucket.has(key)) {
      return false;
    }
    bucket.set(key, true);
    return true;
  }

  public consume(category: ReplicaStateCategory, key: string): boolean {
    const bucket = this.#bucket(category);
    if (!bucket.has(key)) {
      return false;
    }
    bucket.delete(key);
    return true;
  }

  public increment(category: ReplicaStateCategory, key: string): number {
    const bucket = this.#bucket(category);
    const current = bucket.get(key);
    const next = (typeof current === "number" ? current : 0) + 1;
    bucket.set(key, next);
    return next;
  }

  public read(category: ReplicaStateCategory, key: string): StoredValue | undefined {
    return this.#bucket(category).get(key);
  }

  public write(category: ReplicaStateCategory, key: string, value: StoredValue): void {
    this.#bucket(category).set(key, value);
  }

  #bucket(category: ReplicaStateCategory): Map<string, StoredValue> {
    const existing = this.#backend.get(category);
    if (existing !== undefined) {
      return existing;
    }
    const created = new Map<string, StoredValue>();
    this.#backend.set(category, created);
    return created;
  }
}

function probe(name: string, run: ReplicaStateProbe["run"]): ReplicaStateProbe {
  return { name, run };
}

export function replicaStateProbes(shared: boolean): ReplicaStateProbes {
  const primaryBackend: ReplicaBackend = new Map();
  const secondaryBackend = shared
    ? primaryBackend
    : new Map<ReplicaStateCategory, Map<string, StoredValue>>();
  const primary = new MemoryReplica(primaryBackend);
  const secondary = new MemoryReplica(secondaryBackend);
  const select = (identity: ReplicaIdentity) =>
    identity.instance === "primary" ? primary : secondary;
  const visible = (
    category: "authorization" | "sessions" | "tenant-cache",
    key: string,
  ): ReplicaStateProbe =>
    probe(`shares ${category}`, async ({ primary: first, secondary: second, signal }) => {
      select(first).write(category, key, "visible");
      return !signal.aborted && select(second).read(category, key) === "visible";
    });
  const exclusive = (category: "job-ownership" | "locks", key: string): ReplicaStateProbe =>
    probe(`coordinates ${category}`, async ({ primary: first, secondary: second }) => {
      const claims = [select(first).claim(category, key), select(second).claim(category, key)];
      return claims.filter(Boolean).length === 1;
    });

  return {
    authorization: visible("authorization", "decision"),
    "job-ownership": exclusive("job-ownership", "job"),
    locks: exclusive("locks", "lock"),
    nonces: probe("consumes nonces once", async ({ primary: first, secondary: second }) => {
      select(first).write("nonces", "nonce", true);
      return select(second).consume("nonces", "nonce") && !select(first).consume("nonces", "nonce");
    }),
    "rate-limits": probe("shares rate limits", async ({ primary: first, secondary: second }) => {
      const counts = [
        select(first).increment("rate-limits", "subject"),
        select(second).increment("rate-limits", "subject"),
      ];
      return counts[0] === 1 && counts[1] === 2;
    }),
    sessions: visible("sessions", "session"),
    "tenant-cache": visible("tenant-cache", "tenant"),
  };
}

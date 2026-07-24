import type { ObjectBody } from "../src/index.js";

export class TestObjectBody implements ObjectBody {
  readonly #chunks: readonly Uint8Array[];

  private constructor(chunks: readonly Uint8Array[]) {
    this.#chunks = chunks.map((chunk) => Uint8Array.from(chunk));
  }

  public static fromChunks(chunks: readonly Uint8Array[]): TestObjectBody {
    return new TestObjectBody(chunks);
  }

  public async *read(): AsyncIterable<Uint8Array> {
    for (const chunk of this.#chunks) {
      yield Uint8Array.from(chunk);
    }
  }
}

export async function readObjectBody(body: ObjectBody): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let length = 0;
  for await (const chunk of body.read()) {
    chunks.push(Uint8Array.from(chunk));
    length += chunk.length;
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

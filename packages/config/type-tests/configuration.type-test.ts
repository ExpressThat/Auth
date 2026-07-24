import {
  type BindingValues,
  type BuildValues,
  defineConfiguration,
  type PublicValues,
  parseStartupConfiguration,
  type SecretValues,
} from "@expressthat-auth/config";
import { z } from "zod";

const definition = defineConfiguration({
  bindings: z.strictObject({
    clock: z.object({ now: z.custom<() => number>((value) => typeof value === "function") }),
  }),
  build: z.strictObject({ release: z.string() }),
  public: z.strictObject({ origin: z.url() }),
  secrets: z.strictObject({ key: z.string() }),
});

export type PublicConfiguration = PublicValues<typeof definition>;
export type SecretConfiguration = SecretValues<typeof definition>;
export type BuildConfiguration = BuildValues<typeof definition>;
export type RuntimeBindings = BindingValues<typeof definition>;

const configuration = parseStartupConfiguration(definition, {
  bindings: { clock: { now: () => 1 } },
  build: { release: "v1" },
  public: { origin: "https://auth.example.test" },
  secrets: { key: "synthetic" },
});

export const origin: string = configuration.publicValues.origin;
export const release: string = configuration.buildValues.release;
export const secret: string = configuration.secret("key");
export const instant: number = configuration.binding("clock").now();

// @ts-expect-error -- secret keys are constrained by the declared secret schema.
configuration.secret("missing");
// @ts-expect-error -- runtime binding keys are constrained by the binding schema.
configuration.binding("queue");
// @ts-expect-error -- public configuration does not expose secret fields.
configuration.publicValues.key;

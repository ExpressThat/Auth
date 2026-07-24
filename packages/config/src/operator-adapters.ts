import { AdapterIdentifier, RuntimeCapability } from "@expressthat-auth/runtime";
import { OperatorAdapterSelection } from "@expressthat-auth/runtime/operator";
import { z } from "zod";
import { defineConfiguration, parseStartupConfiguration } from "./configuration-parser.js";

const namespacedIdentifier = z
  .string()
  .max(128)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*(?:\/[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*)+$/u);

const selectionSchema = z.strictObject({
  bindings: z
    .array(
      z.strictObject({
        adapter: namespacedIdentifier,
        capability: namespacedIdentifier,
      }),
    )
    .min(1),
  platform: z.strictObject({
    containerArchitecture: z.enum(["amd64", "arm64"]),
    externalCapabilities: z.array(namespacedIdentifier),
    operatingSystem: z.enum(["darwin", "linux", "win32"]),
  }),
  profile: z.enum(["hosted", "local-development", "self-hosted"]),
  runtime: z.strictObject({
    major: z.number().int().positive(),
    minor: z.number().int().nonnegative(),
    patch: z.number().int().nonnegative(),
    runtime: z.literal("node"),
  }),
});

const operatorDefinition = defineConfiguration({
  bindings: z.strictObject({ adapterSelection: selectionSchema }),
  build: z.strictObject({}),
  public: z.strictObject({}),
  secrets: z.strictObject({}),
});

export function parseOperatorAdapterConfiguration(input: unknown): OperatorAdapterSelection {
  const configuration = parseStartupConfiguration(operatorDefinition, {
    bindings: { adapterSelection: input },
    build: {},
    public: {},
    secrets: {},
  });
  const selected = configuration.binding("adapterSelection");
  return OperatorAdapterSelection.create({
    bindings: selected.bindings.map((binding) => ({
      adapter: AdapterIdentifier.parse(binding.adapter),
      capability: RuntimeCapability.parse(binding.capability),
    })),
    platform: selected.platform,
    profile: selected.profile,
    runtime: selected.runtime,
  });
}

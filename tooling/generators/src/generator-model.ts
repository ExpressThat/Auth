import { z } from "zod";

const slugSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u, "must be a lowercase kebab-case slug");

const workspaceRequestSchema = z
  .object({
    command: z.literal("workspace"),
    description: z.string().trim().min(1).max(160),
    kind: z.enum(["application", "library", "provider"]),
    name: slugSchema,
  })
  .strict();

const routeRequestSchema = z
  .object({
    app: slugSchema,
    command: z.literal("route"),
    name: slugSchema,
  })
  .strict();

export type GeneratorRequest =
  | z.infer<typeof routeRequestSchema>
  | z.infer<typeof workspaceRequestSchema>;

export type FileChange = {
  content: string;
  mode: "create" | "ensure" | "replace";
  path: string;
};

export type GenerationPlan = {
  changes: FileChange[];
  summary: string;
};

function readOptions(arguments_: ReadonlyArray<string>): Record<string, string> {
  const tail = arguments_.slice(1);
  if (tail.length % 2 !== 0) {
    throw new Error("Every generator option requires a value.");
  }

  const options: Record<string, string> = {};
  for (let index = 0; index < tail.length; index += 2) {
    const [key, value] = z.tuple([z.string(), z.string()]).parse(tail.slice(index, index + 2));
    if (!key.startsWith("--")) {
      throw new Error("Generator options must use --name value syntax.");
    }

    const normalizedKey = key.slice(2);
    if (normalizedKey.length === 0 || options[normalizedKey] !== undefined) {
      throw new Error(`Invalid or duplicate generator option: ${key}.`);
    }
    options[normalizedKey] = value;
  }
  return options;
}

export function parseGeneratorRequest(arguments_: ReadonlyArray<string>): GeneratorRequest {
  const command = arguments_[0];
  const candidate: Record<string, unknown> = {
    ...readOptions(arguments_),
    command,
  };

  if (command === "workspace") {
    return workspaceRequestSchema.parse(candidate);
  }
  if (command === "route") {
    return routeRequestSchema.parse(candidate);
  }
  throw new Error("Generator command must be workspace or route.");
}

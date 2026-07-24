export type SafeParseResult = {
  success: boolean;
};

export type RuntimeSchema = {
  safeParse: (input: unknown) => SafeParseResult;
};

export type SchemaCases = {
  invalid: unknown[];
  valid: unknown[];
};

export function assertSchemaCases(schema: RuntimeSchema, cases: SchemaCases): void {
  for (const [index, value] of cases.valid.entries()) {
    if (!schema.safeParse(value).success) {
      throw new Error(`Schema rejected valid case ${index}.`);
    }
  }

  for (const [index, value] of cases.invalid.entries()) {
    if (schema.safeParse(value).success) {
      throw new Error(`Schema accepted invalid case ${index}.`);
    }
  }
}

import type { SyntheticSecret } from "./synthetic-secret.js";

export type TenantFixture = {
  createdAtMs: number;
  id: string;
  name: string;
  slug: string;
};

export type ApplicationFixture = {
  createdAtMs: number;
  id: string;
  name: string;
  tenantId: string;
};

export type EnvironmentFixture = {
  id: string;
  name: string;
  tenantId: string;
};

export type UserFixture = {
  createdAtMs: number;
  displayName: string;
  email: string;
  id: string;
  tenantId: string;
};

export type SessionFixture = {
  applicationId: string;
  createdAtMs: number;
  expiresAtMs: number;
  handle: SyntheticSecret;
  tenantId: string;
  userId: string;
};

export type FixtureOverrides<T> = Partial<Omit<T, "createdAtMs" | "id">> & {
  createdAtMs?: number;
  id?: string;
};

export type IsolationFixture = {
  primary: {
    development: EnvironmentFixture;
    production: EnvironmentFixture;
    tenant: TenantFixture;
    user: UserFixture;
  };
  secondary: {
    development: EnvironmentFixture;
    production: EnvironmentFixture;
    tenant: TenantFixture;
    user: UserFixture;
  };
};

export type ProviderOutcome<T> =
  | { status: "success"; value: T }
  | { code: string; status: "rejected" }
  | { code: string; retryAfterMs: number; status: "retryable-failure" }
  | { code: string; status: "permanent-failure" };

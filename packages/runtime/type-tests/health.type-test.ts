import {
  type Clock,
  DependencyHealthObservation,
  type DiagnosticsAccessController,
  HealthCheckId,
  type RuntimeHealthCheck,
  RuntimeHealthService,
  SchemaHealth,
} from "@expressthat-auth/runtime";

export const healthCheck: RuntimeHealthCheck = {
  check: async () => DependencyHealthObservation.healthy(SchemaHealth.notApplicable()),
  id: HealthCheckId.parse("type-test/dependency"),
  requiredForReadiness: true,
  requiresCompatibleSchema: false,
};
export declare const clock: Clock;
export declare const diagnosticsAccess: DiagnosticsAccessController;
export const healthService = new RuntimeHealthService(clock, [healthCheck], diagnosticsAccess);

// @ts-expect-error -- health checks require validated identifiers.
export const invalidHealthCheck: RuntimeHealthCheck = { ...healthCheck, id: "database/control" };

import type {
  ConformanceAxis,
  ConformanceCaseContext,
  ConformanceCaseInput,
  InfrastructureCapabilityKind,
} from "./conformance-model.js";
import { InfrastructureConformanceSuite } from "./conformance-suite.js";

export interface ConformanceProbe {
  readonly name: string;
  readonly run: (context: ConformanceCaseContext) => Promise<void>;
}

export type StatefulConformanceProbes = Readonly<Record<ConformanceAxis, ConformanceProbe>>;
export type CustodyConformanceProbes = Readonly<Omit<StatefulConformanceProbes, "health">>;

export function defineCacheConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("cache", probes, timeoutMilliseconds);
}

export function defineCertificateConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("certificate", probes, timeoutMilliseconds);
}

export function defineDeploymentConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("deployment", probes, timeoutMilliseconds);
}

export function defineDnsConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("dns", probes, timeoutMilliseconds);
}

export function defineKeyManagementConformanceSuite(
  probes: CustodyConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("key-management", probes, timeoutMilliseconds);
}

export function defineObjectStorageConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("object-storage", probes, timeoutMilliseconds);
}

export function defineObservabilityConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("observability", probes, timeoutMilliseconds);
}

export function defineQueueConformanceSuite(
  probes: StatefulConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("queue", probes, timeoutMilliseconds);
}

export function defineSecretConformanceSuite(
  probes: CustodyConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  return defineCapabilitySuite("secret", probes, timeoutMilliseconds);
}

function defineCapabilitySuite(
  capability: InfrastructureCapabilityKind,
  probes: StatefulConformanceProbes | CustodyConformanceProbes,
  timeoutMilliseconds: number,
): InfrastructureConformanceSuite {
  const cases = Object.entries(probes).map(
    ([axis, probe]): ConformanceCaseInput => ({
      axis: parseAxis(axis),
      name: probe.name,
      run: probe.run,
    }),
  );
  return InfrastructureConformanceSuite.define({
    capability,
    cases,
    timeoutMilliseconds,
  });
}

function parseAxis(value: string): ConformanceAxis {
  switch (value) {
    case "concurrency":
    case "failure":
    case "health":
    case "redaction":
    case "residency":
    case "retry":
    case "runtime":
    case "success":
    case "timeout":
      return value;
  }
  throw new TypeError("Conformance probe axis is invalid.");
}

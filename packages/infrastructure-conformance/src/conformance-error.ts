import type {
  ConformanceAxis,
  ConformanceDefinitionCode,
  ConformanceExecutionCode,
  InfrastructureCapabilityKind,
} from "./conformance-model.js";

export class ConformanceDefinitionError extends Error {
  public readonly code: ConformanceDefinitionCode;

  public constructor(code: ConformanceDefinitionCode) {
    super(`Infrastructure conformance suite is invalid (${code}).`);
    this.name = "ConformanceDefinitionError";
    this.code = code;
  }

  public toJSON(): Readonly<{ code: ConformanceDefinitionCode }> {
    return { code: this.code };
  }
}

export class ConformanceExecutionError extends Error {
  public readonly axis: ConformanceAxis;
  public readonly capability: InfrastructureCapabilityKind;
  public readonly code: ConformanceExecutionCode;

  public constructor(
    code: ConformanceExecutionCode,
    capability: InfrastructureCapabilityKind,
    axis: ConformanceAxis,
  ) {
    super(`Infrastructure conformance execution failed (${code}).`);
    this.name = "ConformanceExecutionError";
    this.axis = axis;
    this.capability = capability;
    this.code = code;
  }

  public toJSON(): Readonly<{
    axis: ConformanceAxis;
    capability: InfrastructureCapabilityKind;
    code: ConformanceExecutionCode;
  }> {
    return { axis: this.axis, capability: this.capability, code: this.code };
  }
}

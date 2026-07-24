import { describe, expect, it } from "vitest";
import {
  CertificateAutomationError,
  DnsAutomationError,
  FrontendDeploymentError,
} from "../src/index.js";

describe("managed domain automation errors", () => {
  it.each([
    [new DnsAutomationError("verify", "unavailable"), "DnsAutomationError", true],
    [new DnsAutomationError("prepare", "invalid"), "DnsAutomationError", false],
    [new CertificateAutomationError("renew", "not-ready"), "CertificateAutomationError", true],
    [new CertificateAutomationError("issue", "conflict"), "CertificateAutomationError", false],
    [new FrontendDeploymentError("deploy", "unavailable"), "FrontendDeploymentError", true],
    [new FrontendDeploymentError("verify", "not-ready"), "FrontendDeploymentError", true],
    [new FrontendDeploymentError("remove", "not-found"), "FrontendDeploymentError", false],
  ] as const)("normalizes %s without diagnostics", (error, name, retryable) => {
    expect(error.name).toBe(name);
    expect(error.message).toContain(`failed (${error.code})`);
    expect(error.retryable).toBe(retryable);
    expect(error.toJSON()).toEqual({
      code: error.code,
      operation: error.operation,
      retryable,
    });
  });
});

import { describe, expect, it } from "vitest";
import {
  ActiveImpersonationContext,
  EpochMilliseconds,
  ImpersonationGrantId,
  ImpersonationSessionId,
  NoImpersonationContext,
  PrincipalReference,
  RequestAction,
} from "../src/index.js";
import { activeImpersonation, requestFixture } from "./request-test-fixture.js";

describe("request impersonation context", () => {
  it("captures attributable bounded actor, subject, grant, session, and actions", () => {
    const { action, impersonation, managementActor, endUser } = activeImpersonation();
    const copiedActions = impersonation.actions();

    expect(impersonation.kind).toBe("active");
    expect(impersonation.actor()).toBe(managementActor);
    expect(impersonation.subject()).toBe(endUser);
    expect(copiedActions).toEqual([action]);
    expect(copiedActions).not.toBe(impersonation.actions());
    expect(impersonation.grantId().value()).toContain("grant");
    expect(impersonation.sessionId().value()).toContain("session");
    expect(Number(impersonation.startedAt())).toBe(900);
    expect(Number(impersonation.expiresAt())).toBe(1_500);
    expect(JSON.stringify(impersonation)).toBe('"[REDACTED ACTIVE IMPERSONATION]"');
    expect(JSON.stringify(new NoImpersonationContext())).toBe('"[NO IMPERSONATION]"');
  });

  it("validates namespaced actions and redacting opaque references", () => {
    expect(RequestAction.parse("profile:read").value()).toBe("profile:read");
    expect(JSON.stringify(ImpersonationGrantId.parse("test:grant/reference-001"))).toBe(
      '"[REDACTED IMPERSONATION REFERENCE]"',
    );
    expect(() => RequestAction.parse("read")).toThrow(TypeError);
    expect(() => RequestAction.parse("Profile Read")).toThrow(TypeError);
    expect(() => RequestAction.parse(1)).toThrow(TypeError);
    expect(() => ImpersonationSessionId.parse("short")).toThrow(TypeError);
    expect(() => ImpersonationSessionId.parse("contains spaces and invalid")).toThrow(TypeError);
  });

  it("rejects wrong actors, wrong subjects, duplicate/empty actions, and bad lifetime", () => {
    const fixture = requestFixture();
    const base = {
      actions: [fixture.action],
      actor: fixture.managementActor,
      expiresAt: EpochMilliseconds.parse(1_500),
      grantId: ImpersonationGrantId.parse("test:impersonation/grant-0001"),
      sessionId: ImpersonationSessionId.parse("test:impersonation/session-001"),
      startedAt: EpochMilliseconds.parse(900),
      subject: fixture.endUser,
    };
    expect(() => ActiveImpersonationContext.create({ ...base, actor: fixture.endUser })).toThrow(
      TypeError,
    );
    expect(() =>
      ActiveImpersonationContext.create({
        ...base,
        subject: PrincipalReference.anonymous(),
      }),
    ).toThrow(TypeError);
    expect(() => ActiveImpersonationContext.create({ ...base, actions: [] })).toThrow(TypeError);
    expect(() =>
      ActiveImpersonationContext.create({
        ...base,
        actions: [fixture.action, fixture.action],
      }),
    ).toThrow(TypeError);
    expect(() =>
      ActiveImpersonationContext.create({
        ...base,
        expiresAt: EpochMilliseconds.parse(900),
      }),
    ).toThrow(TypeError);
  });
});

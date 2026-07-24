import {
  type ConformanceCaseInput,
  InfrastructureConformanceSuite,
  requiredConformanceAxes,
} from "@expressthat-auth/infrastructure-conformance";

const cases: ConformanceCaseInput[] = requiredConformanceAxes("queue").map((axis) => ({
  axis,
  name: `${axis} evidence`,
  run: async ({ signal }) => {
    const aborted: boolean = signal.aborted;
    void aborted;
  },
}));

export const suite = InfrastructureConformanceSuite.define({
  capability: "queue",
  cases,
  timeoutMilliseconds: 1_000,
});

// @ts-expect-error -- infrastructure capability names are closed.
requiredConformanceAxes("email");
// @ts-expect-error -- conformance cases must be asynchronous.
const invalidCase: ConformanceCaseInput = { axis: "success", name: "invalid", run: () => {} };
void invalidCase;

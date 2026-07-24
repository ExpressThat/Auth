export type StatePanelState =
  | { status: "empty" }
  | { message: string; status: "error" }
  | { status: "loading" }
  | { items: string[]; status: "success" };

export type StatePanelProps = {
  onRetry: () => void;
  state: StatePanelState;
};

export function StatePanel({ onRetry, state }: StatePanelProps) {
  switch (state.status) {
    case "loading":
      return <p role="status">Loading accounts…</p>;
    case "empty":
      return <p>No accounts found.</p>;
    case "error":
      return (
        <section aria-labelledby="error-title">
          <h2 id="error-title">Unable to load accounts</h2>
          <p role="alert">{state.message}</p>
          <button onClick={onRetry} type="button">
            Retry
          </button>
        </section>
      );
    case "success":
      return (
        <ul aria-label="Accounts">
          {state.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
  }
}

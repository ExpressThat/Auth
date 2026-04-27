import "@expressthat-auth/ui/components";

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app element");

app.innerHTML = `
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Vite + JavaScript Example (Web Component)</h1>
    <p>Renders EXTestButton from @expressthat-auth/ui as a native web component.</p>
    <ex-test-button label="Click Me" variant="primary"></ex-test-button>
  </main>
`;

const button = app.querySelector("ex-test-button");
button?.addEventListener("exTestClick", () => alert("clicked!"));

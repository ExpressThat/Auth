import { defineCustomElements } from "@expressthat-auth/ui/loader";

defineCustomElements();

const app = document.getElementById("app");
if (!app) throw new Error("Missing #app element");

app.innerHTML = `
  <main style="padding: 2rem; font-family: sans-serif">
    <h1>Vite + JavaScript Example (Web Component)</h1>
    <p>Renders ExButton from @expressthat-auth/ui as a native web component.</p>
    <ex-button label="Click Me" variant="primary"></ex-button>
  </main>
`;

const button = app.querySelector("ex-button");
button?.addEventListener("exClick", () => alert("clicked!"));

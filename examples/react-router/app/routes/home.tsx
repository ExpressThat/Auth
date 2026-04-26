import { ExButton } from "@expressthat-auth/ui-react";

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>React Router v7 Example (SSR via withSSR vite plugin)</h1>
      <p>ExButton is server-rendered by the Stencil SSR vite plugin.</p>
      <ExButton label="Click Me" variant="primary" />
    </main>
  );
}

import Button from "@expressthat-auth/ui/preact/button";

export default function App() {
  return (
    <div>
      <h1>Preact — @expressthat-auth/ui</h1>
      <Button label="Hello from Preact" onClick={() => alert("Clicked!")} />
    </div>
  );
}

import Button from "@expressthat-auth/ui/solid/eXButton";
import { render } from "solid-js/web";

function App() {
  return (
    <div>
      <h1>Solid — @expressthat-auth/ui</h1>
      <Button label="Hello from Solid" onClick={() => alert("Clicked!")} />
    </div>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");
render(() => <App />, root);

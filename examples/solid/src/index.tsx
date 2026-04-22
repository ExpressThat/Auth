import Button from "@expressthat-auth/ui/solid/button";
import { render } from "solid-js/web";

function App() {
  return (
    <div>
      <h1>Solid — @expressthat-auth/ui</h1>
      <Button label="Hello from Solid" onClick={() => alert("Clicked!")} />
    </div>
  );
}

render(() => <App />, document.getElementById("root")!);

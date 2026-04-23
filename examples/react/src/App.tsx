import Button from "@expressthat-auth/ui/react/eXButton";

export default function App() {
  return (
    <div>
      <h1>React — @expressthat-auth/ui</h1>
      <Button label="Hello from React" onClick={() => alert("Clicked!")} />
    </div>
  );
}

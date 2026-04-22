import { component$ } from "@builder.io/qwik";
import Button from "@expressthat-auth/ui/qwik/button";

export default component$(() => {
  return (
    <div>
      <h1>Qwik — @expressthat-auth/ui</h1>
      <Button label="Hello from Qwik" />
    </div>
  );
});

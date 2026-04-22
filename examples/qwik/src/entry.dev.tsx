import { render } from "@builder.io/qwik";
import Root from "./root";

const app = document.getElementById("app");
if (!app) throw new Error("Root element #app not found");
render(app, <Root />);

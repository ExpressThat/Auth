import { mount } from "svelte";
import App from "./App.svelte";

const app = document.getElementById("app");
if (!app) throw new Error("Root element #app not found");
mount(App, { target: app });

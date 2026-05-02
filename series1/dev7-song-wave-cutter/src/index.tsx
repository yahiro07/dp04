import { render } from "solid-js/web";
import "./page.css";
import "./utility-classes.css";
import { App } from "./app";

const rootElement = document.getElementById("app");

if (rootElement) {
  render(() => <App />, rootElement);
}

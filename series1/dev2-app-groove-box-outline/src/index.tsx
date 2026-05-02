import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app";
import { startPlaybackPoller } from "./playback/playback-poller";
import "./styles.css";

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("Root element #app was not found.");
}

startPlaybackPoller();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

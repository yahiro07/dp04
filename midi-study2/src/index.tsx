import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "@/App";
import "@/index.css";
import { store } from "@/store/store";

const container = document.getElementById("app");

if (!container) {
  throw new Error("App root not found.");
}

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);

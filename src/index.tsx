import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { PythonProvider } from "react-py";
import App from "./App";

const root = createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <StrictMode>
    <PythonProvider>
      <App />
    </PythonProvider>
  </StrictMode>
);

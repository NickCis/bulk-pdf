import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import workerUrl from "pdfjs-dist/build/pdf.worker?url";
import { GlobalWorkerOptions } from "pdfjs-dist";

import "./index.css";
import App from "./App.tsx";

GlobalWorkerOptions.workerSrc = workerUrl;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

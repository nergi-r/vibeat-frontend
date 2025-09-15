// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "modern-normalize/modern-normalize.css";
import "./styles/main.css";

// The script URL is now hardcoded as it's public.
const SCRIPT_URL = "https://cloud.umami.is/script.js";

// We only read the unique Website ID from the environment.
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;

// Only inject the script if the Website ID is present.
if (WEBSITE_ID) {
  const script = document.createElement("script");
  script.async = true;
  script.src = SCRIPT_URL;
  script.setAttribute("data-website-id", WEBSITE_ID);

  document.head.appendChild(script);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

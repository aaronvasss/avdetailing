import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorLogging } from "./lib/error-log";

installGlobalErrorLogging();

// Prerendered HTML already carries the page's JSON-LD. Helmet re-adds the same
// blocks on mount, so drop the static copies first to avoid duplicate schemas.
document
  .querySelectorAll('head script[type="application/ld+json"]')
  .forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

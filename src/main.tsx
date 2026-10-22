import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorLogging } from "./lib/error-log";

installGlobalErrorLogging();

// Prerendered HTML already carries each page's JSON-LD, and Helmet re-adds the
// same blocks on mount. Drop the static copies so each schema appears once.
document
  .querySelectorAll('head script[type="application/ld+json"]')
  .forEach((el) => el.remove());

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);

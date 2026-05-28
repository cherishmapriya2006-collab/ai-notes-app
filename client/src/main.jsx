import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

// Initialize global font from localStorage (default: inter)
const storedFont = (typeof window !== "undefined" && localStorage.getItem("font")) || "inter";
if (typeof document !== "undefined") {
  document.documentElement.classList.remove("font-inter", "font-georgia", "font-mono");
  document.documentElement.classList.add(`font-${storedFont}`);
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: "#1f2937", color: "#fff" } }} />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

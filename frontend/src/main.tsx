import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./auth/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppRouter } from "./routing/AppRouter";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

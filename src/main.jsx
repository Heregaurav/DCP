import React from "react";
import ReactDOM from "react-dom/client";
import AppMain from "./AppMain";

import "./index.css";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppMain />
    </AuthProvider>
    
  </React.StrictMode>
);

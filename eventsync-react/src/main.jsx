import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { UserProvider } from "./sso/UserContext";
import "./styles/main.css";

const msalInstance = new PublicClientApplication(msalConfig);

const Main = () => {
  const [isMsalInitialized, setIsMsalInitialized] = useState(false);

  useEffect(() => {
    const initializeMsal = async () => {
      await msalInstance.initialize();  // Ensure MSAL is fully initialized
      setIsMsalInitialized(true);
    };

    initializeMsal();
  }, []);

  if (!isMsalInitialized) {
    return <div>Loading MSAL...</div>;  // Prevent errors by not rendering before MSAL is ready
  }

  return (
    <MsalProvider instance={msalInstance}>
      <UserProvider>
        <App />
      </UserProvider>
    </MsalProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);

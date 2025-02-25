import React from "react";
import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../authConfig";

export const SignInButton = () => {
  const { instance } = useMsal();

  const handleLogin = () => {
    instance.loginRedirect(loginRequest).catch((e) => console.log(e));
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        border: "1px solid #ccc",
        padding: "10px 1px",
        fontSize: "16px",
        fontWeight: "500",
        cursor: "pointer",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
        minWidth: "250px", // Ensures enough space for text
        whiteSpace: "nowrap", // Prevents text from wrapping
        color: "#000",
      }}
    >
      <img
        src="/src/images/microsoft.png"
        alt="Microsoft Logo"
        style={{ width: "20px", height: "20px", marginRight: "10px" }}
      />
      Sign in with Microsoft
    </button>
  );
};


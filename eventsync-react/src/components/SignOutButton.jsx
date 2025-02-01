import React from "react";
import { useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";


export const SignOutButton = () => {
  const { instance } = useMsal();

  const handleLogout = (logoutType) => {
   if (logoutType === "redirect") {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
      });
    }
  };

  return (
    <Button onClick={() => handleLogout("redirect")} variant="contained" size="small">
      <img 
        src="src/images/logout1.png" 
        alt="Logout"
        style={{ width: "20px", height: "20px" }} 
      />
    </Button>
  );
};

export default SignOutButton;
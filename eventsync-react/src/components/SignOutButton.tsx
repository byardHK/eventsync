import { useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";
import LogoutRounded from '@mui/icons-material/Logout';


export const SignOutButton = () => {
  const { instance } = useMsal();

  const handleLogout = (logoutType: string) => {
    if (logoutType === "redirect") {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/home",
      });
    }
  };

  return (
    <Button onClick={() => handleLogout("redirect")} variant="contained" size="small">
      <LogoutRounded></LogoutRounded>
      
    </Button>
  );
};

export default SignOutButton;
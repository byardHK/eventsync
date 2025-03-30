import { useMsal } from "@azure/msal-react";
import { Button } from "@mui/material";
import LogoutRounded from '@mui/icons-material/Logout';
import logo from '../images/logo.png'; 


export const SignOutButton = () => {
  const { instance } = useMsal();

  if (!instance) {
    return <div className="loading-container">
    <img src={logo} alt="EventSync Logo" className="logo" />
    <p className="loading-text">Loading...</p>
    </div>;
}

  const handleLogout = (logoutType: string) => {
    if (logoutType === "redirect") {
      instance.logoutRedirect({
        postLogoutRedirectUri: "/",
      });
    }
  };

  return (
    <Button onClick={() => handleLogout("redirect")} variant="contained" size="small">
      <LogoutRounded sx={{color: "black"}}></LogoutRounded>
    </Button>
  );
};

export default SignOutButton;
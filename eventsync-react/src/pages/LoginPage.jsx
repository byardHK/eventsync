import React from "react";
import Navbar from "react-bootstrap/Navbar";
import Card from "react-bootstrap/Card";
import { useIsAuthenticated } from "@azure/msal-react";
import { SignInButton } from "../components/SignInButton";
import "../styles/style.css";

export const LoginPage = () => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <div style={{ 
      backgroundColor: "rgb(66, 135, 245)", 
      height: "100vh", 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center",
      padding: "20px"  // Ensures spacing on smaller screens
    }}>
      <Navbar bg="primary" variant="dark" className="navbarStyle">
        <div className="collapse navbar-collapse justify-content-end"></div>
      </Navbar>

      <Card style={{ 
        width: "90%",   // Responsive width (adjusts to screen size)
        maxWidth: "18rem",  // Maximum width of the card
        backgroundColor: "white", 
        padding: "20px", 
        borderRadius: "12px", 
        textAlign: "center",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)"
      }}>
        <Card.Body>
          <img 
            src="/src/images/logo.png" 
            alt="App Logo" 
            style={{ width: "120px", marginBottom: "15px" }} 
          />
          <h5 className="login-text">Your best moments start here.</h5>
          <br />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SignInButton />
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default LoginPage;

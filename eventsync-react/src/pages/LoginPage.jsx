/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import Navbar from "react-bootstrap/Navbar";


import { useIsAuthenticated } from "@azure/msal-react";
import { SignInButton } from "../components/SignInButton";
import { SignOutButton } from "../components/SignOutButton";

import "../styles/style.css"

/**
 * Renders the navbar component with a sign in or sign out button depending on whether or not a user is authenticated
 * @param props
 */
export const LoginPage = (props) => {
  const isAuthenticated = useIsAuthenticated();
  
  return (
    <>
      <Navbar bg="primary" variant="dark" className="navbarStyle">
        <div className="collapse navbar-collapse justify-content-end">
           
        </div>
      </Navbar>
      <br />
      <br />
      <div class="login-logo">
        <img src="/src/images/logo.png" alt="" class="login-logo"/>
      </div>

      <br> 
      </br>
      <br> 
      </br>
      

      <h5>
        <center>
          Your best momments start here.
        </center>
      </h5>
      <br />
      <br />
      <br> 
      </br>
      <center><SignInButton /></center>
      
    </>
  );
};
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react';
import App from './App.jsx'
import ReactDOM from 'react-dom/client'; 


import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';
import { msalConfig } from './authConfig.js';
import { UserProvider1 } from './UserContext'



// Bootstrap components
import 'bootstrap/dist/css/bootstrap.min.css';

const msalInstance = new PublicClientApplication(msalConfig);
console.log(msalConfig);
const root = ReactDOM.createRoot(document.getElementById('root'));

/**
 * We recommend wrapping most or all of your components in the MsalProvider component. It's best to render the MsalProvider as close to the root as possible.
 */
 root.render(
  <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <UserProvider1>
            <App />
        </UserProvider1>
      </MsalProvider>
  </React.StrictMode>
);

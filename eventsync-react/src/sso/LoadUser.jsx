import { loginRequest } from '../authConfig';
import { callMsGraph } from '../graph';
import React, { useState, useEffect} from 'react';
import { useMsal } from '@azure/msal-react';
import {useUser} from './UserContext'

export const LoadUser = () => {
   const { setUserDetails } = useUser();
    const { instance, accounts } = useMsal();
  
    function RequestUserData() {
      instance
          .acquireTokenSilent({
              ...loginRequest,
              account: accounts[0],
          })
          .then((response) => {
            callMsGraph(response.accessToken).then((response) => {
                setUserDetails({
                    firstName: response.givenName,
                    lastName: response.surname,
                    email: response.userPrincipalName
                })
            });

          });
    }

  
    useEffect(() => {
      RequestUserData();

      // the following code section was written by generative AI (ChatGPT)
      const refreshInterval = setInterval(() => {
        console.log("Refreshing token...");
        RequestUserData();
        },  45 * 60 * 1000);

        return () => clearInterval(refreshInterval);
     }, []);

     // end of code section
  
    return null;
  };
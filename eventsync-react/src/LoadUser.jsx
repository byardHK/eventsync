import { loginRequest } from './authConfig';
import { callMsGraph } from './graph';
import React, { useState, useEffect} from 'react';
import { useMsal } from '@azure/msal-react';
import {useUser} from './UserContext'

export const LoadUser = () => {
   const { setUserDetails } = useUser();
    const { instance, accounts } = useMsal();
    const [graphData, setGraphData] = useState(null);
  
    function RequestUserData() {
      instance
          .acquireTokenSilent({
            
              ...loginRequest,
              account: accounts[0],
              
          })
          .then((response) => {
            callMsGraph(response.accessToken).then((response) => {
                setGraphData(response)
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
     }, [])
  
    return ( // return nothing, but sets the user data correctly
        <>
        </>
    );
  };
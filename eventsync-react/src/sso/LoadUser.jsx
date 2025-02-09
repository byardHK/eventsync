import { loginRequest } from '../authConfig';
import { callMsGraph } from '../graph';
import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useUser } from './UserContext';
import axios from 'axios';

export const LoadUser = () => {
    const { userDetails, setUserDetails } = useUser();
    const [isNewUser, setIsNewUser] = useState(false);
    const { instance, accounts } = useMsal();

    useEffect(() => {
        const RequestUserData = async () => {
            try {
                const response = await instance.acquireTokenSilent({
                    ...loginRequest,
                    account: accounts[0],
                });

                const graphData = await callMsGraph(response.accessToken);
                const userEmail = graphData.userPrincipalName;

                console.log("Fetched Graph User:", graphData);

                // Check if user exists in the database
                const res = await axios.get(`http://localhost:5000/api/check_user/${userEmail}`);
                const userExists = res.data.exists;
                console.log("does the user exist", userExists);
                setIsNewUser(!userExists);

                if (userExists) {
                    await setExistingUserData(userEmail);
                } else {
                    console.log("New user detected.");
                }

            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        const setExistingUserData = async (email) => {
            try {
                const res = await axios.get(`http://localhost:5000/api/get_user/${email}`);
                console.log("Fetched user data from API:", res.data);
        
                setUserDetails(prevDetails => {
                    const updatedDetails = {
                        ...prevDetails,
                        firstName: res.data[0].fname,
                        lastName: res.data[0].lname,
                        email: res.data[0].id || null,
                        isAdmin: res.data[0].isAdmin || null,
                        isBanned: res.data[0].isBanned,
                        isPublic: res.data[0].isPublic || null,
                        bio: res.data[0].bio || null,
                        notificationFrequency: res.data[0].notificationFrequency || null,
                        notificationId: res.data[0].notificationId || null,
                        numTimesReported: res.data[0].numTimesReported,
                        profilePicture: res.data[0].profilePicture || null,
                        friendRequest: res.data[0].friendRequest || null,
                        eventInvite: res.data[0].eventInvite || null,
                        eventCancellation: res.data[0].eventCancellation || null,
                    };
                    console.log("Updated userDetails:", updatedDetails);
                    return updatedDetails;
                });
                
                
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        };
        

        // Initial request
        RequestUserData();

        // Refresh user data every 45 minutes
        const refreshInterval = setInterval(() => {
            console.log("Refreshing user data...");
            RequestUserData();
        }, 45 * 60 * 1000);

        return () => clearInterval(refreshInterval);

    }, [instance, accounts, setUserDetails]);


    useEffect(() => {
        console.log("Updated userDetails state:", userDetails);
    }, [userDetails]); // Logs when userDetails changes

    return null;
};

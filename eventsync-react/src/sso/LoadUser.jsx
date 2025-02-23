import { loginRequest } from '../authConfig';
import { callMsGraph } from '../graph';
import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useUser } from './UserContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../components/Cosntants";

export const LoadUser = () => {
    const { userDetails, setUserDetails } = useUser();
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();

    useEffect(() => {
        const requestUserData = async () => {
            console.log('🔍 Starting user data request...');

            try {
                if (accounts.length === 0) {
                    console.log('🔄 No accounts found. Redirecting to login...');
                    await instance.loginRedirect(loginRequest);
                    return;
                }

                let response;
                try {
                    console.log('🔑 Trying silent token acquisition...');
                    response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0],
                    });
                } catch (error) {
                    if (error.name === "InteractionRequiredAuthError") {
                        console.warn('⚠️ Silent token failed. Trying popup...');
                        response = await instance.acquireTokenPopup(loginRequest);
                    } else {
                        throw error;
                    }
                }

                console.log('✅ Token acquired:', response);

                const graphData = await callMsGraph(response.accessToken);
                console.log('📊 Graph Data:', graphData);

                const userEmail = graphData.userPrincipalName;
                console.log(`📧 Checking if user exists: ${userEmail}`);

                const res = await axios.get(`${BASE_URL}/api/check_user/${userEmail}`);
                const userExists = res.data.exists;
                console.log(`🔎 User exists: ${userExists}`);

                if (userExists) {
                    await FetchExistingUser(userEmail, setUserDetails);
                    console.log(userDetails);
                    console.log("i'm navigating to home");
                    navigate('/home');
                } else {
                    await setNewUserData(graphData);
                    console.log("i'm navigating to onboarding")
                    navigate('/onboardingPage');
                }

             
            } catch (error) {
                console.error("❌ Error during user data request:", error);
               
            }
        };

        const setNewUserData = async (graphData) => {
            console.log('🆕 Setting new user details...');
            setUserDetails({
                isOnboardingComplete: false,
                firstName: graphData.givenName,
                lastName: graphData.surname,
                email: graphData.userPrincipalName,
                microsoftId: graphData.id,
            });
        };

        requestUserData();

        const refreshInterval = setInterval(() => requestUserData(), 45 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, [accounts]);

    return null;
};


export const FetchExistingUser = async (email, setUserDetails) => {
    try {
        const res = await axios.get(`${BASE_URL}/api/get_user/${email}`);
        console.log("Fetched user data: (load user)", res.data);

        setUserDetails(prevDetails => {
            const updatedDetails = {
                ...prevDetails,
                firstName: res.data[0].fname,
                lastName: res.data[0].lname,
                email: res.data[0].id,
                isAdmin: res.data[0].isAdmin,
                isBanned: res.data[0].isBanned,
                isPublic: res.data[0].isPublic,
                bio: res.data[0].bio,
                notificationFrequency: res.data[0].notificationFrequency,
                notificationId: res.data[0].notificationId,
                numTimesReported: res.data[0].numTimesReported,
                profilePicture: res.data[0].profilePicture,
                friendRequest: res.data[0].friendRequest,
                eventInvite: res.data[0].eventInvite,
                eventCancelled: res.data[0].eventCancelled,
            };
            return updatedDetails;
        });
        
    } catch (error) {
        console.error("Error retrieving user details from database or setting them internally:", error);
    }
};

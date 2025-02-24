import { loginRequest } from '../authConfig';
import { callMsGraph } from '../graph';
import React, { useState, useEffect, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { useUser } from './UserContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../components/Constants";

export const LoadUser = () => {
    const { userDetails, setUserDetails } = useUser();
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();

    const requestUserData = useCallback(async () => {
        if (accounts.length === 0) {
            await instance.loginRedirect(loginRequest);
            return;
        }

        try {
            let response;
            try {
                response = await instance.acquireTokenSilent({ ...loginRequest, account: accounts[0] });
            } catch (error) {
                if (error.name === "InteractionRequiredAuthError") {
                    console.warn('⚠️ Silent token failed. Trying popup...');
                    response = await instance.acquireTokenPopup(loginRequest);
                } else {
                    throw error;
                }
            }

            const graphData = await callMsGraph(response.accessToken);
            const userEmail = graphData.userPrincipalName;
            const res = await axios.get(`${BASE_URL}/api/check_user/${userEmail}`);

            if (res.data.exists) {
                await FetchExistingUser(userEmail, setUserDetails);
            } else {
                await setNewUserData(graphData);
                navigate('/onboardingPage');
            }
        } catch (error) {
            console.error("❌ Error during user data request:", error);
        }
    }, [accounts, instance, navigate, setUserDetails]);

    const setNewUserData = async (graphData) => {
        setUserDetails({
            isOnboardingComplete: false,
            firstName: graphData.givenName,
            lastName: graphData.surname,
            email: graphData.userPrincipalName,
            microsoftId: graphData.id,
        });
    };

    useEffect(() => {
        requestUserData();
        const refreshInterval = setInterval(requestUserData, 45 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, [requestUserData]);

    return null;
};

export const FetchExistingUser = async (email, setUserDetails) => {
    try {
        const res = await axios.get(`${BASE_URL}/api/get_user/${email}`);
        console.log("Fetched user data:", res.data);

        setUserDetails(prevDetails => ({
            ...prevDetails,
            isOnboardingComplete: true,
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
        }));
    } catch (error) {
        console.error("Error retrieving user details:", error);
    }
};

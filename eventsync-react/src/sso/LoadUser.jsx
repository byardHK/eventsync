import { loginRequest } from '../authConfig';
import { callMsGraph } from '../graph';
import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { useUser } from './UserContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../components/Constants";

export const LoadUser = () => {
    const { setUserDetails } = useUser();
    const { instance, accounts } = useMsal();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userDataLoaded, setUserDataLoaded] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        const RequestUserData = async () => {
            try {
                if (accounts.length === 0) {
                    await instance.loginRedirect(loginRequest);
                    return;
                }

                let response;
                try {
                    response = await instance.acquireTokenSilent({
                        ...loginRequest,
                        account: accounts[0],
                    });
                } catch (error) {
                    if (error.name === "InteractionRequiredAuthError") {
                        response = await instance.acquireTokenPopup(loginRequest);
                    } else {
                        throw error;
                    }
                }

                const graphData = await callMsGraph(response.accessToken);
                const userEmail = graphData.userPrincipalName;

                const res = await axios.get(`${BASE_URL}/api/check_user/${userEmail}`);
                const userExists = res.data.exists;
                setIsNewUser(!userExists);

                if (userExists) {
                    await setExistingUserData(userEmail);
                } else {
                    setUserDetails({
                        isOnboardingComplete: false,
                        firstName: graphData.givenName,
                        lastName: graphData.surname,
                        email: graphData.userPrincipalName,
                        microsoftId: graphData.id
                    });
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setLoading(false);
                setUserDataLoaded(true);
            }
        };

        const setExistingUserData = async (email) => {
            try {
                const res = await axios.get(`${BASE_URL}/api/get_user/${email}`);
                console.log("Fetched user data from API:", res.data);
        
                setUserDetails(prevDetails => {
                    const updatedDetails = {
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
                    };
                    console.log("Updated userDetails:", updatedDetails);
                    return updatedDetails;
                });
                
                
            } catch (error) {
                console.error('Error fetching user details:', error);
            }
        };

        RequestUserData();

        const refreshInterval = setInterval(() => RequestUserData(), 45 * 60 * 1000);
        return () => clearInterval(refreshInterval);

    }, [instance, accounts, setUserDetails]);

    useEffect(() => {
        if (userDataLoaded && isNewUser) {
            const timer = setTimeout(() => navigate('/onboardingPage'), 100);
            return () => clearTimeout(timer);
        }
    }, [isNewUser]);

    return null;
};

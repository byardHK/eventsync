import { Navigate, Outlet } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import axios from 'axios';
import { useState, useEffect } from 'react';

export const OnboardingRoute = () => {
    const { accounts } = useMsal();
    const [isNewUser, setIsNewUser] = useState(false); 

    useEffect(() => {
        const checkUserExists = async () => {
            if (accounts.length === 0) return; 

            const userEmail = accounts[0].username;
            try {
                const res = await axios.get(`http://localhost:5000/api/check_user/${userEmail}`);
                setIsNewUser(!res.data.exists);
                console.log("exists", !res.data.exists);
                console.log("isnewuser", isNewUser)
            } catch (error) {
                console.error("Error checking user existence:", error);
                setIsNewUser(false); 
            }
        };

        useEffect(() => {
            console.log("Updated isNewUser:", isNewUser);
        }, [isNewUser]);
        

        checkUserExists();
    }, [accounts]);

    //if (isNewUser === null) return <LoadingSpinner />; // Show a loading spinner

    return isNewUser ? <Navigate to="/onboarding" /> : <Navigate to="/" replace />;
};



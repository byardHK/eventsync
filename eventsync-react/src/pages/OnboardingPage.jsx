import React, { useState } from "react";
import { Card, Box, Button, TextField, Switch, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useUser } from "../sso/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/style.css";
import { BASE_URL } from '../components/Constants';
import {FetchExistingUser} from '../sso/LoadUser';

const OnboardingPage = () => {
    const { userDetails, setUserDetails } = useUser();
    const navigate = useNavigate();
    console.log(userDetails);
    const userId = userDetails.email;
    const token = userDetails.token;
    console.log("onboarding page  tkn ", token);

    // Initialize form state with userDetails
    const [firstName, setFirstName] = useState(userDetails.firstName);
    const [lastName, setLastName] = useState(userDetails.lastName);
    const [email, setEmail] = useState(userDetails.email);
    const [bio, setBio] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [gender, setGender] = useState("Undefined");
    const [eventCancelled, setEventCancelled] = useState(false)


    const addNewUser = async () => {
        const updatedUser = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            bio: bio,
            isPublic: isPublic,
            gender: gender,
            eventCancelled: eventCancelled
        };

        try {
            console.log(updatedUser);
            await axios.post(`${BASE_URL}/api/add_user`, updatedUser,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            );
            
        }
        catch(error){
            console.error("Error submitting onboarding data:", error);
        }

    }

    const handleSubmit = async () => {
        try {
            await addNewUser();     
            await FetchExistingUser(userId, setUserDetails, userDetails.token);   
            navigate("/home");      
        } catch (error) {
            console.error("Error submitting new user:", error);
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center" // Centers content horizontally
            alignItems="center" // Centers content vertically
            flexDirection="column"
            bgcolor="#1c284c"
             padding="10px"
            minHeight="75vh" // Ensure full page height
            width="90vw" // Full width
        >
    <Card
        sx={{
            width: "90%",
            maxWidth: "400px",
            padding: "20px",
            borderRadius: "12px",
            textAlign: "center",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
            marginTop: "20px",
            marginBottom: "20px",
        }}
    >
                <h2>Welcome to EventSync.</h2>
                <p>Sign up to start.</p>

                <TextField
                    fullWidth
                    label="First Name"
                    value={firstName}
                    onChange={(e) => {
                        const val = e.target.value
                        if(val.length <= 20){
                            setFirstName(val)
                        }                       
                    }}
                    margin="normal"
                />
                
                <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => {
                        const val = e.target.value
                        if(val.length <= 20){
                            setLastName(val)
                        }                       
                    }}
                    margin="normal"
                />
                
                <TextField
                    fullWidth
                    label="Email"
                    value={email}
                    disabled
                    margin="normal"
                />

<FormControl fullWidth margin="normal">
    <InputLabel id="gender-label">Gender</InputLabel>
    <Select
        labelId="gender-label"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        label="Gender" // Explicitly associate the label
    >
        <MenuItem value="Undefined">Prefer Not To Say</MenuItem>
        <MenuItem value="Male">Male</MenuItem>
        <MenuItem value="Female">Female</MenuItem>
    </Select>
</FormControl>

                <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    value={bio}
                    onChange={(e) => {
                        const val = e.target.value
                        if(val.length <= 200){
                            setBio(val)
                        }                       
                    }}
                    margin="normal"
                />
                
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Event Cancellation Notifications</span>
                    <Switch style={{ color: "#1c284c" }} checked={eventCancelled} onChange={(e) => setEventCancelled(e.target.checked)} />
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2, backgroundColor: "#1c284c", color: "white" }}
                    onClick={handleSubmit}
                >
                    Sign up
                </Button>
            </Card>
        </Box>
    );
};

export default OnboardingPage;

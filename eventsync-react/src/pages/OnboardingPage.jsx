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
    const [notificationFrequency, setNotificationFrequency] = useState("None");
    const [gender, setGender] = useState("Undefined");
    const [receiveFriendRequest, setReceiveFriendRequest] = useState(false);
    const [invitedToEvent, setInvitedToEvent] = useState(false);
    const [eventCancelled, setEventCancelled] = useState(false);


    const addNewUser = async () => {
        const updatedUser = {
            firstName: firstName,
            lastName: lastName,
            email: email,
            bio: bio,
            isPublic: isPublic,
            notificationFrequency: notificationFrequency,
            gender: gender,
            receiveFriendRequest: receiveFriendRequest,
            invitedToEvent: invitedToEvent, 
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
            bgcolor="rgb(66, 135, 245)"
            padding="20px"
            minHeight="100vh" // Ensure full page height
            width="100vw" // Full width
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
                    onChange={(e) => setFirstName(e.target.value)}
                    margin="normal"
                />
                
                <TextField
                    fullWidth
                    label="Last Name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
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
                    onChange={(e) => setBio(e.target.value)}
                    margin="normal"
                />

                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Make profile public?</span>
                    <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                </Box>

                <FormControl fullWidth margin="normal">
                    <InputLabel>Notification Frequency</InputLabel>
                    <Select
                        value={notificationFrequency}
                        onChange={(e) => setNotificationFrequency(e.target.value)}
                    >
                        <MenuItem value="None">None</MenuItem>
                        <MenuItem value="Daily">Daily</MenuItem>
                        <MenuItem value="Weekly">Weekly</MenuItem>
                        <MenuItem value="Monthly">Monthly</MenuItem>
                    </Select>
                </FormControl>

                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Friend Request Notifications</span>
                    <Switch checked={receiveFriendRequest} onChange={(e) => setReceiveFriendRequest(e.target.checked)} />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Event Invite Notifications</span>
                    <Switch checked={invitedToEvent} onChange={(e) => setInvitedToEvent(e.target.checked)} />
                </Box>
                
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Event Cancellation Notifications</span>
                    <Switch checked={eventCancelled} onChange={(e) => setEventCancelled(e.target.checked)} />
                </Box>

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleSubmit}
                >
                    Sign up
                </Button>
            </Card>
        </Box>
    );
};

export default OnboardingPage;

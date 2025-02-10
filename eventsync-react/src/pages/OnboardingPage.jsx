import React, { useState } from "react";
import { Card, Box, Button, TextField, Switch, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useUser } from "../sso/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/style.css";

const OnboardingPage = () => {
    const { userDetails, setUserDetails } = useUser();
    const navigate = useNavigate();

    // Initialize form state with userDetails
    const [firstName, setFirstName] = useState(userDetails.firstName || "");
    const [lastName, setLastName] = useState(userDetails.lastName || "");
    const [email, setEmail] = useState(userDetails.email || "");
    const [bio, setBio] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [notificationFrequency, setNotificationFrequency] = useState("None");
    const [adminPassword, setAdminPassword] = useState(""); // State for admin password
    const [isAdmin, setIsAdmin] = useState(false); // State for 'Admin?' switch

    const handleSubmit = async () => {
        const updatedUser = {
            firstName,
            lastName,
            email,
            bio,
            isPublic,
            notificationFrequency,
            adminPassword: isAdmin ? adminPassword : null // Only send password if user is admin
        };

        try {
            await axios.post("http://localhost:5000/api/onboard_user", updatedUser);
            //setUserDetails((prev) => ({ ...prev, ...updatedUser })); // Update global user state
            navigate("/dashboard"); // Redirect to dashboard after onboarding
        } catch (error) {
            console.error("Error submitting onboarding data:", error);
        }
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="flex-start" // Align to the top for better spacing
            flexDirection="column" // Ensure layout is stacked vertically
            bgcolor="rgb(66, 135, 245)" // Blue background color
            padding="20px"
            minHeight="100vh" // Ensure full page height
            sx={{ overflow: "auto" }} // Allow scrolling if content exceeds height
        >
            <Card
                sx={{
                    width: "90%",
                    maxWidth: "400px",
                    padding: "20px",
                    borderRadius: "12px",
                    textAlign: "center",
                    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
                    marginTop: "20px", // Space above the card
                    marginBottom: "20px", // Space below the card
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
                    <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                </Box>

                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Event Invite Notifications</span>
                    <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                </Box>
                
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Event Cancellation Notifications</span>
                    <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                </Box>

                {/* Admin Toggle */}
                <Box display="flex" alignItems="center" justifyContent="space-between" mt={2}>
                    <span>Admin?</span>
                    <Switch checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} />
                </Box>

                {/* Conditionally render Admin Password input */}
                {isAdmin && (
                    <TextField
                        fullWidth
                        label="Admin Password"
                        type="password" // Mask the password input
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        margin="normal"
                    />
                )}

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={handleSubmit}
                >
                    Complete Setup
                </Button>
            </Card>
        </Box>
    );
};

export default OnboardingPage;

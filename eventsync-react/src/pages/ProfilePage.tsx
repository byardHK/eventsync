import { Card, Box, Button, Chip, TextField, Switch, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import TagModal from "../components/TagModal";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../sso/UserContext";
import "../styles/style.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate, useParams } from "react-router-dom";
import SignOutButton from "../components/SignOutButton";
import Tag from "../types/Tag";
import { BASE_URL } from "../components/Cosntants";

function ProfilePage() {
    const { id: profileId } = useParams();
    const { userDetails, setUserDetails } = useUser();
    const userId = userDetails.email;

    if (profileId == userId) {
        const [userTags, setUserTags] = useState<Tag[]>([]);
        const [aboutMe, setAboutMe] = useState<string>(userDetails.bio || "");
        const [userTagsTrigger, setUserTagsTrigger] = useState<number>(0);
        const [isPrivate, setIsPrivate] = useState<boolean>(!userDetails.isPublic);
        const [notificationFrequency, setNotificationFrequency] = useState<string>(userDetails.notificationFrequency || "None");
        const [receiveFriendRequest, setReceiveFriendRequest] = useState<boolean>(userDetails.friendRequest || false);
        const [invitedToEvent, setInvitedToEvent] = useState<boolean>(userDetails.eventInvite || false);
        const [eventCancelled, setEventCancelled] = useState<boolean>(userDetails.eventCancelled || false);

    const handleSaveChanges = async () => {
        try {
            const data = {
                userId: userId,
                bio: aboutMe,
                isPublic: !isPrivate,
                notificationFrequency: notificationFrequency,
                receiveFriendRequest: receiveFriendRequest,
                invitedToEvent: invitedToEvent,
                eventCancelled: eventCancelled
            };
            console.log("data  sending: ", data)
            
            const response = await axios.post(`${BASE_URL}/api/update_user_profile`, data);
            if (response.status === 200) {
                console.log("Profile updated successfully!");
            }

            try {
                const res = await axios.get(`${BASE_URL}/api/get_user/${userId}`);
                console.log("Fetched user data from API:", res.data);
        
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
                    console.log("Updated userDetails:", updatedDetails);
                    return updatedDetails;
                });

                } catch (error) {
                    console.error("Error fetching profile:", error);
                }


            } catch (error) {
                console.error("Error updating profile:", error);
            }
        };

        const handleSave = async (tagsToAdd: Tag[], tagsToDelete: Tag[]) => {
            try {
                const deselectedData = { deselectedTags: tagsToDelete, userId };
                const selectedData = { selectedTags: tagsToAdd, userId };

            const [deleteResponse, saveResponse] = await Promise.all([
                fetch(`${BASE_URL}/delete_user_deselected_tags/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(deselectedData),
                }),
                fetch(`${BASE_URL}/save_user_selected_tags/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(selectedData),
                }),
            ]);

                if (deleteResponse.ok && saveResponse.ok) {
                    console.log("Tags updated successfully");
                    reloadUserTags();
                }
            } catch (error) {
                console.error("Error updating tags:", error);
            }
        };

        const reloadUserTags = () => {
            setUserTagsTrigger((prev) => prev + 1);
        };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_user_tags/${userId}/`);
                setUserTags(response.data);

                const res = await axios.get(`${BASE_URL}/api/get_user/${userId}`);
                console.log("Fetched user data from API:", res.data);
        
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
                    console.log("Updated userDetails:", updatedDetails);
                    return updatedDetails;
                });

                } catch (error) {
                    console.error("Error fetching tags:", error);
                }
            };
            fetchData();
        }, [userTagsTrigger]);

        const navigate = useNavigate();
        const handleBackClick = () => navigate("/");

        return (
            <Box display="flex" flexDirection="column" alignItems="center" width="85%" maxWidth="350px" margin="auto">
                {/* Back & Logout Buttons */}
                <Box display="flex" justifyContent="space-between" width="100%">
                    <Button onClick={handleBackClick}>
                        <ArrowBackIcon />
                    </Button>
                    <SignOutButton />
                </Box>

                {/* Profile Card */}
                <Card sx={{ width: '100%', marginTop: '16px', borderRadius: '16px', padding: '16px', backgroundColor: '#f9f9f9' }}>
                    {/* Profile Picture & Name */}
                    <Box textAlign="center" mt={2}>
                        <Box
                            width="80px"
                            height="80px"
                            borderRadius="50%"
                            bgcolor="grey.300"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            margin="auto"
                        >
                            {/* Placeholder Profile Picture */}
                            <span style={{ fontSize: '2rem' }}>🧑</span>
                        </Box>
                        <h2 style={{ marginTop: '0.5rem' }}>{userDetails.firstName} {userDetails.lastName}</h2>
                    </Box>

                    {/* About Me */}
                    <Box width="100%" mt={2}>
                        <h3>Bio</h3>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            variant="outlined"
                            value={aboutMe}
                            onChange={(e) => setAboutMe(e.target.value)}
                            onBlur={handleSaveChanges}  // Auto-save when focus is lost
                        />
                    </Box>

                    {/* Interests (Tags) */}
                    <Box width="100%" mt={2}>
                        <h3 style={{ display: 'flex', alignItems: 'center' }}>
                            Interests
                            <div style={{ marginLeft: '10px' }}>
                                <TagModal savedTags={userTags} handleSave={handleSave} />
                            </div>
                        </h3>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {userTags.map((tag, index) => (
                                <Chip key={index} label={tag.name} />
                            ))}
                        </Box>
                        <br />
                        
                    </Box>

                    {/* Settings */}
                    <Box width="100%" mt={2}>
                        <h3>Settings</h3>

                        {/* Privacy Toggle */}
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                            <span>Keep info private?</span>
                            <Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} onBlur={handleSaveChanges} />
                        </Box>

                        {/* Notification Frequency */}
                        <br />
                        <Box mt={1}>
                            <FormControl fullWidth>
                                <InputLabel>Notification Digest</InputLabel>
                                <br />
                                <Select
                                    value={notificationFrequency}
                                    onChange={(e) => setNotificationFrequency(e.target.value)}
                                    onBlur={handleSaveChanges}  // Auto-save when focus is lost
                                >
                                    <MenuItem value="None">None</MenuItem>
                                    <MenuItem value="Daily">Daily</MenuItem>
                                    <MenuItem value="Weekly">Weekly</MenuItem>
                                    <MenuItem value="Monthly">Monthly</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {/* Instant Notifications */}
                        <Box mt={2}>
                            <h4>Instant Notifications</h4>
                            <Box display="flex" flexDirection="column" gap={1}>
                                <Box display="flex" justifyContent="space-between">
                                    <span>Receive friend request</span>
                                    <Switch
                                        checked={receiveFriendRequest}
                                        onChange={(e) => setReceiveFriendRequest(e.target.checked)}
                                        onBlur={handleSaveChanges}  // Auto-save when focus is lost
                                    />
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <span>Invited to Event</span>
                                    <Switch
                                        checked={invitedToEvent}
                                        onChange={(e) => setInvitedToEvent(e.target.checked)}
                                        onBlur={handleSaveChanges}  // Auto-save when focus is lost
                                    />
                                </Box>
                                <Box display="flex" justifyContent="space-between">
                                    <span>Event Cancelled</span>
                                    <Switch
                                        checked={eventCancelled}
                                        onChange={(e) => setEventCancelled(e.target.checked)}
                                        onBlur={handleSaveChanges}  // Auto-save when focus is lost
                                    />
                                </Box>
                                <Box mt={3} textAlign="center">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => {
                                            handleSaveChanges();
                                            handleSave([], []); // Adjust if there are changes in the tags as well
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Card>
            </Box>
        );
    } else {
        const [userTags, setUserTags] = useState<Tag[]>([]);
        const [profileDetails, setProfileDetails] = useState<any>({});
    
        useEffect(() => {
            const fetchData = async () => {
                try {
                    const response = await axios.get(`${BASE_URL}/get_user_tags/${profileId}/`);
                    setUserTags(response.data);
    
                    const res = await axios.get(`${BASE_URL}/api/get_user/${profileId}`);
                    console.log("Fetched user data from API:", res.data);
    
                    const details = {
                        firstName: res.data[0].fname,
                        lastName: res.data[0].lname,
                        email: res.data[0].id,
                        bio: res.data[0].bio,
                        profilePicture: res.data[0].profilePicture,
                    };
                    console.log("Updated profileDetails:", details);
                    setProfileDetails(details);
                } catch (error) {
                    console.error("Error fetching tags:", error);
                }
            };
            fetchData();
        }, [profileId]);
    
        const navigate = useNavigate();
        const handleBackClick = () => navigate("/");
    
        return (
            <Box display="flex" flexDirection="column" alignItems="center" width="85%" maxWidth="350px" margin="auto">
                {/* Back Button */}
                <Box display="flex" justifyContent="space-between" width="100%">
                    <Button onClick={handleBackClick}>
                        <ArrowBackIcon />
                    </Button>
                </Box>
    
                {/* Profile Card */}
                <Card sx={{ width: '100%', marginTop: '16px', borderRadius: '16px', padding: '16px', backgroundColor: '#f9f9f9' }}>
                    {/* Profile Picture & Name */}
                    <Box textAlign="center" mt={2}>
                        <Box
                            width="80px"
                            height="80px"
                            borderRadius="50%"
                            bgcolor="grey.300"
                            display="flex"
                            justifyContent="center"
                            alignItems="center"
                            margin="auto"
                        >
                            {/* Placeholder Profile Picture */}
                            <span style={{ fontSize: '2rem' }}>🧑</span>
                        </Box>
                        <h2 style={{ marginTop: '0.5rem' }}>{profileDetails.firstName} {profileDetails.lastName}</h2>
                    </Box>
    
                    {/* About Me */}
                    <Box width="100%" mt={2}>
                        <h3>Bio</h3>
                        <Box
                            sx={{
                                width: '92.5%',
                                padding: '10px',
                                border: '1px solid rgba(0, 0, 0, 0.23)',
                                borderRadius: '4px',
                                backgroundColor: 'white',
                                color: 'black',
                                minHeight: '56px',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {profileDetails.bio}
                        </Box>
                    </Box>
    
                    {/* Interests (Tags) */}
                    <Box width="100%" mt={2}>
                        <h3 style={{ display: 'flex', alignItems: 'center' }}>
                            Interests
                        </h3>
                        <Box display="flex" flexWrap="wrap" gap={1}>
                            {userTags.map((tag, index) => (
                                <Chip key={index} label={tag.name} />
                            ))}
                        </Box>
                        <br />
                    </Box>
                </Card>
            </Box>
        );
    }
}

export default ProfilePage;
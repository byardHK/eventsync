import { Card, Box, Button, Chip, TextField, Switch, Select, MenuItem, FormControl, InputLabel, IconButton, Typography, Modal, Grid } from "@mui/material";
import TagModal from "../components/TagModal";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../sso/UserContext";
import { UserDetails } from "../sso/UserContext";
import "../styles/style.css";
import { useNavigate, useParams } from "react-router-dom";
import SignOutButton from "../components/SignOutButton";
import Tag from "../types/Tag";
import { BASE_URL } from "../components/Constants";
import FlagIcon from '@mui/icons-material/Flag';
import ReportModal from "../components/ReportModal";
import User from "../types/User";
import logo from '../images/logo.png';
import BackButton from "../components/BackButton";
import EditIcon from "@mui/icons-material/Edit";

function ProfilePage() {
    const { id: profileId } = useParams();
    const { userDetails, setUserDetails } = useUser();
    const navigate = useNavigate();

    const [userTags, setUserTags] = useState<Tag[]>([]);
    const [aboutMe, setAboutMe] = useState<string>(userDetails?.bio || "");
    const [isPrivate, setIsPrivate] = useState<boolean>(!userDetails?.isPublic);
    const [eventCancelled, setEventCancelled] = useState<boolean>(userDetails?.eventCancelled || false);
    const [profilePictureModalOpen, setProfilePictureModalOpen] = useState(false);
    const [profileDetails, setProfileDetails] = useState<any>({});
    const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
    const [user, setUser] = useState<User>();
    const [userTagsTrigger, setUserTagsTrigger] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);

    const emojiMap: { [key: number]: string } = {
        1: "😀",
        2: "😎",
        3: "🧑",
        4: "👩‍💻",
        5: "👨‍🎨",
        6: "👩‍🚀",
        7: "👨‍⚕️",
        8: "👩‍🍳",
    };

    const userId = userDetails?.email;

    // Fetch user tags
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_user_tags/${profileId || userId}/`, {
                    headers: {
                        Authorization: `Bearer ${userDetails?.token}`,
                        "Content-Type": "application/json",
                    },
                });
                setUserTags(response.data);
            } catch (error) {
                console.error("Error fetching tags:", error);
            }
        };
        fetchTags();
    }, [profileId, userTagsTrigger]);

    useEffect(() => {
        const fetchProfileDetails = async () => {
            setLoading(true);
            try {
                if (profileId !== userId) {
                    const res = await axios.get(`${BASE_URL}/api/get_user/${profileId}`, {
                        headers: {
                            Authorization: `Bearer ${userDetails?.token}`,
                            "Content-Type": "application/json",
                        },
                    });
                    const details = {
                        firstName: res.data[0].fname,
                        lastName: res.data[0].lname,
                        email: res.data[0].id,
                        bio: res.data[0].bio,
                        profilePicture: res.data[0].profilePicture,
                    };
                    setProfileDetails(details);
                }
            } catch (error) {
                console.error("Error fetching profile details:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfileDetails();
    }, [profileId, userId, userDetails]);

    useEffect(() => {
        if (userDetails) {
            setAboutMe(userDetails.bio || "");
            setIsPrivate(!userDetails.isPublic);
            setEventCancelled(userDetails.eventCancelled || false);
            setLoading(false);
        }
    }, [userDetails]);

    const handleProfilePictureChange = async (emoji: string) => {
        try {
            const emojiNumber = Object.keys(emojiMap).find(
                (key) => emojiMap[Number(key)] === emoji
            );

            if (!emojiNumber) {
                throw new Error("Invalid emoji selected");
            }

            setUserDetails((prevDetails: any) => ({
                ...prevDetails,
                profilePicture: Number(emojiNumber),
            }));

            await axios.post(
                `${BASE_URL}/api/update_user_profile`,
                {
                    userId: userId,
                    bio: aboutMe,
                    isPublic: !isPrivate,
                    eventCancelled: eventCancelled,
                    profilePicture: Number(emojiNumber),
                },
                {
                    headers: {
                        Authorization: `Bearer ${userDetails?.token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            setProfilePictureModalOpen(false);
        } catch (error) {
            console.error("Error updating profile picture:", error);
        }
    };

    const handleSaveChanges = async () => {
        try {
            const data = {
                userId: userId,
                bio: aboutMe,
                isPublic: !isPrivate,
                eventCancelled: eventCancelled
            };

            // update the db
            await axios.post(`${BASE_URL}/api/update_user_profile`, data, {
                headers: {
                    'Authorization': `Bearer ${userDetails?.token}`,
                    'Content-Type': 'application/json',
                }
            });

            // grab the info you just set from the database
            const res = await axios.get(`${BASE_URL}/api/get_user/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${userDetails?.token}`,
                    "Content-Type": "application/json",
                }
            });

            // set the details
            setUserDetails((prevDetails: any) => {
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
            console.log(userDetails);
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
                    headers: {
                        'Authorization': `Bearer ${userDetails?.token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(deselectedData),
                }),
                fetch(`${BASE_URL}/save_user_selected_tags/`, {
                    method: "POST",
                    headers: {
                        'Authorization': `Bearer ${userDetails?.token}`,
                        "Content-Type": "application/json"
                    },
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

    const goToMessages = async () => {
        if (user) {
            try {
                const response = await axios.get(`${BASE_URL}/get_individual_chat_id/${user.id}/${userId}`);
                navigate(`/viewChat/${response.data[0].chatId}`);
            } catch (error) {
                console.error("Error redirecting to chat:", error);
            }
        }
    };

    if (loading || !userDetails || !userDetails.email) {
        return (
            <div className="loading-container">
                <img src={logo} alt="EventSync Logo" className="logo" />
                <Typography className="loading-text">Loading...</Typography>
            </div>
        );
    }

    return profileId === userId ? (
        // Render user's own profile
        <Box display="flex" flexDirection="column" alignItems="center">
            {/* Back & Logout Buttons */}
            <Box display="flex" flexDirection="row" justifyContent="space-between" sx={{ width: "90%", backgroundColor: "#1c284c", position: 'fixed', top: '0px', paddingBottom: "10px", paddingTop: "10px", paddingRight: 2, "z-index": 10 }}>
                <BackButton></BackButton>
                <SignOutButton />
            </Box>

            {/* Profile Card */}
            <Card sx={{ margin: '16px', borderRadius: '16px', padding: '16px', backgroundColor: '#f9f9f9', marginTop: 8 }}>
                {/* Profile Picture & Name */}
                <Box textAlign="center" mt={2} position="relative">
                    <Box
                        width="80px"
                        height="80px"
                        borderRadius="50%"
                        bgcolor="grey.300"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        margin="auto"
                        position="relative"
                    >
                        <span style={{ fontSize: "2rem" }}>
                            {emojiMap[Number(userDetails.profilePicture) ?? 0] || "🧑"}
                        </span>
                        <Chip
                            icon={<EditIcon />}
                            label=""
                            size="small"
                            sx={{
                                position: "absolute",
                                bottom: 0,
                                right: 0,
                                backgroundColor: "#1c284c",
                                color: "white",
                                cursor: "pointer",
                            }}
                            onClick={() => setProfilePictureModalOpen(true)}
                        />
                    </Box>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        style={{ marginTop: "0.5rem" }}
                    >
                        {userDetails.firstName} {userDetails.lastName}
                    </Typography>
                </Box>

                {/* Profile Picture Modal */}
                <Modal
                    open={profilePictureModalOpen}
                    onClose={() => setProfilePictureModalOpen(false)}
                    aria-labelledby="profile-picture-modal"
                    aria-describedby="profile-picture-selection"
                >
                    <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 300,
                            bgcolor: "background.paper",
                            borderRadius: 2,
                            boxShadow: 24,
                            p: 4,
                        }}
                    >
                        <Typography
                            id="profile-picture-modal"
                            variant="h6"
                            component="h2"
                            textAlign="center"
                            mb={2}
                        >
                            Select a Profile Picture
                        </Typography>
                        <Grid container spacing={2} justifyContent="center">
                            {Object.entries(emojiMap).map(([key, emoji]) => (
                                <Grid item key={key}>
                                    <Button
                                        onClick={() => handleProfilePictureChange(emoji)}
                                        sx={{
                                            fontSize: "2rem",
                                            minWidth: "50px",
                                            minHeight: "50px",
                                            borderRadius: "50%",
                                            backgroundColor: "#f0f0f0",
                                            "&:hover": {
                                                backgroundColor: "#d0d0d0",
                                            },
                                        }}
                                    >
                                        {emoji}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Modal>

                {/* About Me */}
                <Box width="100%" mt={2} paddingTop={3}>
                    <Typography fontWeight="bold" variant="h5">Bio</Typography>
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
                <Box width="100%" mt={2} paddingTop={3}>
                    <Typography fontWeight="bold" variant="h5" style={{ display: 'flex', alignItems: 'center' }}>
                        Interests
                        <div style={{ marginLeft: '10px' }}>
                            <TagModal savedTags={userTags} handleSave={handleSave} />
                        </div>
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} paddingTop={3}>
                        {userTags.map((tag, index) => (
                            <Chip sx={{ backgroundColor: '#71A9F7', color: "black" }} key={index} label={tag.name} />
                        ))}
                    </Box>
                    <br />
                </Box>

                {/* Settings */}
                <Box width="100%" mt={2} paddingTop={3}>
                    <Typography fontWeight="bold" variant="h5">Settings</Typography>

                    {/* Privacy Toggle */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" paddingTop={3}>
                        <Typography>Keep info private?</Typography>
                        <Switch style={{ color: "#1c284c" }} checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} onBlur={handleSaveChanges} />
                    </Box>

                    {/* Instant Notifications */}
                    <Box mt={2}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography>Notifications for Event Cancelled</Typography>
                            <Switch
                                style={{ color: "#1c284c" }}
                                checked={eventCancelled}
                                onChange={(e) => setEventCancelled(e.target.checked)}
                                onBlur={handleSaveChanges}  // Auto-save when focus is lost
                            />
                        </Box>
                        <Box mt={3} textAlign="center">
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#1c284c", color: "white" }}
                                onClick={() => {
                                    handleSaveChanges();
                                    handleSave([], []);// Adjust if there are changes in the tags as well
                                    navigate("/home");
                                }}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Card>
        </Box>
    ) : (
        // Render another user's profile
        <Box display="flex" flexDirection="column" alignItems="center" width="85%" maxWidth="350px" margin="auto">
            {/* Back Button */}
            <ReportModal input={user} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="user" />
            <Box display="flex" flexDirection="row" justifyContent="space-between" width="100%">
                <BackButton></BackButton>
                <IconButton onClick={() => setReportModalOpen(true)}>
                    <FlagIcon style={{ color: '#ad1f39' }}></FlagIcon>
                </IconButton>
            </Box>

            {/* Profile Card */}
            <Card sx={{ width: '100%', height: "80vh", marginTop: '16px', borderRadius: '16px', padding: '16px', backgroundColor: '#f9f9f9' }}>
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
                    <Typography variant="h4" style={{ marginTop: '0.5rem' }}>{profileDetails.firstName} {profileDetails.lastName}</Typography>
                </Box>

                {/* About Me */}
                <Box width="100%" mt={2} paddingTop={3}>
                    <Typography variant="h5" fontWeight="bold">Bio</Typography>
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
                        <Typography>{profileDetails.bio}</Typography>
                    </Box>
                </Box>

                {/* Interests (Tags) */}
                <Box width="100%" mt={2} paddingTop={3}>
                    <Typography fontWeight="bold" variant="h5" style={{ display: 'flex', alignItems: 'center' }}>
                        Interests
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1} paddingTop={1}>
                        {userTags.map((tag, index) => (
                            <Chip key={index} label={tag.name} sx={{ backgroundColor: '#71A9F7' }} />
                        ))}
                    </Box>
                    <br />
                </Box>

                <Box width="100%" mt={2} textAlign='center' paddingTop={5}>
                    <Button sx={{ backgroundColor: "#1c284c" }} variant="contained" onClick={goToMessages}>
                        Message
                    </Button>
                </Box>
            </Card>
        </Box>
    );
}

export default ProfilePage;
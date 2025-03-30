import axios from 'axios';
import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../sso/UserContext';
import { Button, Typography, Paper, Box, Dialog, DialogTitle, DialogContent, Fab, TextField, Grid2, Accordion, AccordionSummary, AccordionDetails, Card } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import { BASE_URL } from '../components/Constants';

function FriendsPage() {
    const { userDetails } = useUser();
    const [users, setUsers] = useState<EventSyncUser[]>([]);
    const [friends, setFriends] = useState<EventSyncUser[]>([]);
    const [requests, setRequests] = useState<EventSyncUser[]>([]);
    const [pending, setPending] = useState<EventSyncUser[]>([]);
    const [OpenDialog, setOpenDialog] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [filteredUsers, setFilteredUsers] = useState(users);
    const [isFriendsPage ] = useState<Boolean>(true); 
    const [refreshTrigger, setRefreshTrigger] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (userDetails?.email) {
            refreshData(userDetails.email);
        }
    }, [userDetails]);

    const refreshData = async (userId: string) => {
        try {
            const [usersResponse, friendsResponse, pendingResponse] = await Promise.all([
                axios.get(`${BASE_URL}/get_unfriended_users/${userId}/`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                axios.get(`${BASE_URL}/get_friends/${userId}/`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                }),
                axios.get(`${BASE_URL}/get_pending_friends/${userId}/`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            ]);
            setUsers(usersResponse.data || []);
            setFilteredUsers(usersResponse.data || []);
            setFriends(friendsResponse.data || []);
            setRequests(pendingResponse.data.requests || []);
            setPending(pendingResponse.data.pending || []);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    function toggleFriendsGroupPages(isFriendsPage: boolean){
        if(!isFriendsPage){
            navigate('/groups');
        }
    }

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSearchInput('');
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchInput(value);
        setFilteredUsers(users.filter(user => `${user.fname} ${user.lname}`.toLowerCase().includes(value.toLowerCase())));
    };

    const handleRequestAction = () => {
        setRefreshTrigger(!refreshTrigger);
    };

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <Box sx={{width: "96%", position: 'fixed', top: '0px', paddingBottom: "10px", paddingTop: "10px", backgroundColor: "#1c284c",  "z-index": 10}}>
                <Box display="flex" flexDirection="row">
                    <Button 
                        variant={isFriendsPage ? "contained" : "outlined"} 
                        fullWidth
                        onClick={() => {toggleFriendsGroupPages(true)}}
                        sx={{
                            color: isFriendsPage
                            ? 'black'
                            : 'white'
                        }}
                    >
                        Friends
                    </Button>
                    <Button 
                        variant={!isFriendsPage ? "contained" : "outlined"} 
                        fullWidth
                        onClick={() => {toggleFriendsGroupPages(false)}}
                        sx={{
                            color: !isFriendsPage
                            ? 'black'
                            : 'white'
                        }}
                    >
                        Groups
                    </Button>
                </Box>
                {!isFriendsPage ?
                    <></>:
                    <>
                        <Button sx={{ width:"100%", marginTop: "15px", color: "black"}} title="Add Event Button" variant="contained" onClick={handleOpenDialog}>
                            <AddIcon sx={{color: "black", paddingRight: 1}}/>
                            Add Friend
                        </Button>
                    </>
                }
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                paddingBottom={10}
                paddingTop={13}
            >
                <Accordion defaultExpanded disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                        aria-controls="panel1-content"
                        id="panel1-header"
                    >
                        <Typography sx={{color: "white"}} variant="h4" component="span">Friends</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {friends.length > 0 ?
                            <FriendsList friends={friends} refreshData={() => userDetails.email && refreshData(userDetails.email)} />
                            :
                            <Typography sx={{color: "white"}}>No Friends</Typography>
                        }
                    </AccordionDetails>
                </Accordion>
                <Accordion disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography sx={{color: "white"}} variant="h4" component="span">Friend Requests</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {requests.length > 0 ?
                            <RequestsList requests={requests} refreshData={() => userDetails.email && refreshData(userDetails.email)} onRequestAction={handleRequestAction} />
                            :
                            <Typography sx={{color: "white"}}>No Friend Requests</Typography>
                        }
                    </AccordionDetails>
                </Accordion>
                <Accordion disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                    <AccordionSummary
                    expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                    aria-controls="panel3-content"
                    id="panel3-header"
                >
                    <Typography sx={{color: "white"}} variant="h4" component="span">Pending Friends</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {pending.length > 0 ?
                            <PendingList pending={pending} refreshData={() => userDetails.email && refreshData(userDetails.email)}/>
                            :
                            <Typography sx={{color: "white"}}>No Pending Friend Requests</Typography>
                        }
                    </AccordionDetails>
                </Accordion>
                <Box
                    sx={{width: "100%", position: 'fixed', bottom: '75px'}}
                    paddingRight={3}
                    display="flex"
                    justifyContent="right"
                    alignItems="right"
                >
                </Box>
                <Dialog open={OpenDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm" scroll='body'>
                    <Box
                        alignItems="center"
                        width="300px"
                        height="500px"
                        bgcolor="white"
                    >
                        <DialogTitle>
                            <TextField
                                sx={{ width: '250px' }}
                                value={searchInput}
                                onChange={handleSearchChange}
                                label="Search Users"
                                variant="outlined"
                                fullWidth
                            />
                            <Button
                                aria-label="close"
                                onClick={handleCloseDialog}
                                style={{ position: 'absolute', right: '-12px', top: '8px' }}
                            >
                                <CloseIcon />
                            </Button>
                        </DialogTitle>
                        <DialogContent>
                            <UserList users={filteredUsers} refreshData={() => userDetails.email && refreshData(userDetails.email)} onAddFriend={handleCloseDialog} />
                        </DialogContent>
                    </Box>
                </Dialog>
                <BottomNavBar userId={userDetails.email!} key={refreshTrigger.toString()} />
            </Box>
        </Box>
    </>
}

function FriendsList({ friends, refreshData }: { friends: EventSyncUser[]; refreshData: () => void }) {
    const { userDetails } = useUser();
    const navigate = useNavigate();

    const removeFriend = async (userId: string, friendId: string) => {
        try {
            await axios.delete(`${BASE_URL}/remove_friend/${userId}/${friendId}/`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            refreshData();
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (<Box>
            {Array.isArray(friends) && friends.map((friend, index) => (
                <Box key={index}
                    onClick={() => {navigate(`/profile/${friend.id}`);}}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    width="300px"
                    padding="10px"
                    // border="1px solid #ccc"
                    // borderRadius="5px"
                    margin="5px 0"
                    bgcolor="white"
                >
                    <Button 
                        variant="contained" 
                        onClick={(e) => {
                            e.stopPropagation();
                            userDetails.email && removeFriend(userDetails.email, friend.id);
                        }}
                    >
                        <CloseIcon/>
                    </Button>
                    <Box flexGrow={1} textAlign="left" marginLeft={5}>
                            {`${friend.fname} ${friend.lname}`}
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

function UserList({ users, refreshData, onAddFriend }: { users: EventSyncUser[]; refreshData: () => void; onAddFriend: () => void }) {
    const { userDetails } = useUser();

    const addFriend = async (userId: string, friendId: string) => {
        try {
            console.log(userDetails.token);
            await axios.post(`${BASE_URL}/add_friend/${userId}/${friendId}/`,{},{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            refreshData();
        } catch (error) {
            console.error('Error adding friend:', error);
        }
    };

    return (
        <Box>
            {Array.isArray(users) && users.map((user, index) => (
                <Card
                    key={index}
                    sx={{
                        width: "300px", 
                        padding: "10px", 
                        backgroundColor: "white", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        margin: "5px 0"
                    }}
                    square={false}
                >
                    {`${user.fname} ${user.lname}`}
                    <Button 
                        variant="contained" 
                        onClick={() => {
                            userDetails.email && addFriend(userDetails.email, user.id)
                            onAddFriend();
                        }}
                    >
                        <AddIcon/>
                    </Button>
                </Card>
            ))}
        </Box>
    );
}

function RequestsList({ requests, refreshData, onRequestAction }: { requests: EventSyncUser[]; refreshData: () => void; onRequestAction: () => void }) {
    const { userDetails } = useUser();

    const acceptFriend = async (userId: string, friendId: string) => {
        try {
            console.log(userDetails.token);
            await axios.post(`${BASE_URL}/accept_friend_request/${userId}/${friendId}/`, {}, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            refreshData();
            onRequestAction();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const removeRequest = async (userId: string, friendId: string) => {
        try {
            await axios.delete(`${BASE_URL}/reject_friend_request/${userId}/${friendId}/`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            refreshData();
            onRequestAction();
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    return (
        <Box>
            {Array.isArray(requests) && requests.map((user, index) => (
                <Card
                    key={index}
                    sx={{
                        width: "300px", 
                        padding: "10px", 
                        backgroundColor: "white", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        margin: "5px 0"
                    }}
                    square={false}
                >
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => userDetails.email && removeRequest(userDetails.email, user.id)}
                    >
                        <CloseIcon/>
                    </Button>
                    {`${user.fname} ${user.lname}`}
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => userDetails.email && acceptFriend(userDetails.email, user.id)}
                    >
                        <CheckIcon/>
                    </Button>
                </Card>
            ))}
        </Box>
    );
}

function PendingList({ pending, refreshData }: { pending: EventSyncUser[]; refreshData: () => void }) {
    const { userDetails } = useUser();

    const removeRequest = async (userId: string, friendId: string) => {
        try {
            await axios.delete(`${BASE_URL}/remove_friend_request/${userId}/${friendId}/`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            refreshData();
        } catch (error) {
            console.error('Error removing request:', error);
        }
    };

    return (
        <Box>
            {Array.isArray(pending) && pending.map((user, index) => (
                <Card
                    key={index}
                    sx={{
                        width: "300px", 
                        padding: "10px", 
                        backgroundColor: "white", 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        margin: "5px 0"
                    }}
                    square={false}
                >
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => userDetails.email && removeRequest(userDetails.email, user.id)}
                    >
                        <CloseIcon/>
                    </Button>
                    <Box flexGrow={1} textAlign="left" marginLeft={5}>
                        {`${user.fname} ${user.lname}`}
                    </Box>
                </Card>
            ))}
        </Box>
    );
}

enum NotificationFrequency {
    None = "none",
    Low = "low",
    Normal = "normal",
    High = "high",
}

type EventSyncUser = {
    id: string;
    fname: string;
    lname: string;
    isAdmin: boolean;
    profilePicture: string;
    notificationFrequency: NotificationFrequency;
    isPublic: boolean;
    isBanned: boolean;
    numTimesReported: number;
};

export default FriendsPage;

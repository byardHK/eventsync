import axios from 'axios';
import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import { useUser } from '../sso/UserContext';
import "../styles/style.css";
import { Button, Typography, Paper, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

function FriendsPage() {
    const { userDetails } = useUser();
    const [users, setUsers] = useState<EventSyncUser[]>([]);
    const [friends, setFriends] = useState<EventSyncUser[]>([]);
    const [requests, setRequests] = useState<EventSyncUser[]>([]);
    const [pending, setPending] = useState<EventSyncUser[]>([]);

    useEffect(() => {
        if (userDetails?.email) {
            refreshData(userDetails.email);
        }
    }, [userDetails]);

    const refreshData = async (userId: string) => {
        try {
            const [usersResponse, friendsResponse, pendingResponse] = await Promise.all([
                axios.get(`http://localhost:5000/get_unfriended_users/${userId}/`),
                axios.get(`http://localhost:5000/get_friends/${userId}/`),
                axios.get(`http://localhost:5000/get_pending_friends/${userId}/`),
            ]);

            setUsers(usersResponse.data || []);
            setFriends(friendsResponse.data || []);
            setRequests(pendingResponse.data.requests || []);
            setPending(pendingResponse.data.pending || []);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            padding={2}
        >
            <Typography variant="h4" gutterBottom>Users to Friend</Typography>
            <UserList users={users} refreshData={() => userDetails.email && refreshData(userDetails.email)} />
            
            <Typography variant="h4" gutterBottom>Friends of Current User</Typography>
            <FriendsList friends={friends} refreshData={() => userDetails.email && refreshData(userDetails.email)} />
            
            <Typography variant="h4" gutterBottom>Friend Requests</Typography>
            <RequestsList requests={requests} refreshData={() => userDetails.email && refreshData(userDetails.email)} />

            <Typography variant="h4" gutterBottom>Pending Friend Requests</Typography>
            <PendingList pending={pending} refreshData={() => userDetails.email && refreshData(userDetails.email)}/>

            <BottomNavBar/>
        </Box>
    );
}

function FriendsList({ friends, refreshData }: { friends: EventSyncUser[]; refreshData: () => void }) {
    const { userDetails } = useUser();

    const removeFriend = async (userId: string, friendId: string) => {
        try {
            await axios.delete(`http://localhost:5000/remove_friend/${userId}/${friendId}/`);
            refreshData();
        } catch (error) {
            console.error('Error removing friend:', error);
        }
    };

    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {Array.isArray(friends) && friends.map((friend, index) => (
                <li key={index}>
                    <Paper elevation={3}>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            width="300px"
                            padding="10px"
                            border="1px solid #ccc"
                            borderRadius="5px"
                            margin="5px 0"
                            bgcolor="white"
                        >
                            <Button 
                                variant="contained" 
                                color="secondary" 
                                onClick={() => userDetails.email && removeFriend(userDetails.email, friend.id)}
                            >
                                <DeleteOutlineIcon/>
                            </Button>
                            {`${friend.fname} ${friend.lname}`}
                        </Box>
                    </Paper>
                </li>
            ))}
        </ul>
    );
}

function UserList({ users, refreshData }: { users: EventSyncUser[]; refreshData: () => void }) {
    const { userDetails } = useUser();

    const addFriend = async (userId: string, friendId: string) => {
        try {
            await axios.post(`http://localhost:5000/add_friend/${userId}/${friendId}/`);
            refreshData();
        } catch (error) {
            console.error('Error adding friend:', error);
        }
    };

    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {Array.isArray(users) && users.map((user, index) => (
                <li key={index}>
                    <Paper elevation={3}>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            width="300px"
                            padding="10px"
                            border="1px solid #ccc"
                            borderRadius="5px"
                            margin="5px 0"
                            bgcolor="white"
                        >
                        {`${user.fname} ${user.lname}`}
                            <Button 
                                variant="contained" 
                                onClick={() => userDetails.email && addFriend(userDetails.email, user.id)}
                            >
                                Add Friend
                            </Button>
                        </Box>
                    </Paper>
                </li>
            ))}
        </ul>
    );
}

function RequestsList({ requests, refreshData }: { requests: EventSyncUser[]; refreshData: () => void }) {
    const { userDetails } = useUser();

    const acceptFriend = async (userId: string, friendId: string) => {
        try {
            await axios.post(`http://localhost:5000/accept_friend_request/${userId}/${friendId}/`);
            refreshData();
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const removeRequest = async (userId: string, friendId: string) => {
        try {
            await axios.delete(`http://localhost:5000/reject_friend_request/${userId}/${friendId}/`);
            refreshData();
        } catch (error) {
            console.error('Error rejecting request:', error);
        }
    };

    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {Array.isArray(requests) && requests.map((user, index) => (
                <li key={index}>
                    <Paper elevation={3}>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            width="300px"
                            padding="10px"
                            border="1px solid #ccc"
                            borderRadius="5px"
                            margin="5px 0"
                            bgcolor="white"
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
                        </Box>
                    </Paper>
                </li>
            ))}
        </ul>
    );
}

function PendingList({ pending, refreshData }: { pending: EventSyncUser[]; refreshData: () => void }) {
    const { userDetails } = useUser();

    const removeRequest = async (userId: string, friendId: string) => {
        try {
            await axios.delete(`http://localhost:5000/remove_friend_request/${userId}/${friendId}/`);
            refreshData();
        } catch (error) {
            console.error('Error removing request:', error);
        }
    };

    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {Array.isArray(pending) && pending.map((user, index) => (
                <li key={index}>
                    <Paper elevation={3}>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            width="300px"
                            padding="10px"
                            border="1px solid #ccc"
                            borderRadius="5px"
                            margin="5px 0"
                            bgcolor="white"
                        >
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={() => userDetails.email && removeRequest(userDetails.email, user.id)}
                            >
                                <CloseIcon/>
                            </Button>
                            {`${user.fname} ${user.lname}`}
                        </Box>
                    </Paper>
                </li>
            ))}
        </ul>
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

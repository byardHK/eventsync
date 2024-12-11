import Box from '@mui/material/Box';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function FriendsPage() {
    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <h1>Friends of Current User</h1>
            <FriendsList/>
            <Link to="/">Home Page</Link>
        </Box>
    </>
};

function FriendsList() {
    const [friends, getFriends] = useState<EventSyncUser[]>([]);    

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('http://localhost:5000/get_friends/');
            const res: EventSyncUser[] = response.data;
            getFriends(res);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    return <ul>
        {friends.map((friend, index) =>
            <li key={index}>{`Friend name: ${friend.fname} ${friend.lname}   Bio: ${friend.bio}`}</li>
        )}
    </ul>;
};


enum NotificationFrequency{
    None = "none",
    Low = "low", 
    Normal = "normal",
    High = "high"
}

type EventSyncUser = {
    id: String;
    fname: String;
    lname: String;
    isAdmin: Boolean;
    bio: String;
    profilePicture: String;
    notificationFrequency: NotificationFrequency;
    isPublic: Boolean;
    isBanned: Boolean;
    numTimesReported: number;
}

export default FriendsPage;
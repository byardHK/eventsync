import { useEffect, useState } from 'react';
import { Box, Button, Badge } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import axios from 'axios';
import { BASE_URL } from './Constants';

function BottomNavBar({ userId }: { userId: string }) {
    const [friendRequests, setFriendRequests] = useState(0);

    useEffect(() => {
        async function fetchFriendRequests() {
            try {
                const response = await axios.get(`${BASE_URL}/get_friend_requests/${userId}/`);
                setFriendRequests(response.data.friendRequestsCount);
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        }

        fetchFriendRequests();
    }, [userId]);

    return<Box
        display="flex"
        flexDirection="row"
        width="100%"
        paddingBottom={2}
        paddingTop={2}
        justifyContent="space-around"
        style={{ position: 'fixed', bottom: '0' }}
    >
        <Link title="Link to Home Page" to="/home">
            <Button title="Home Page Button" variant="contained">
                <HomeIcon/>
            </Button>
        </Link>
        <Link title="Link to My Events Page" to="/myEvents">
            <Button title="My EVents Page Button" variant="contained">
                <CalendarMonthIcon/>
            </Button>
        </Link>
        <Link to="/chatHome">
            <Button variant="contained">
                <ChatIcon/>
            </Button>
        </Link>
        <Link to="/friends">
            <Badge badgeContent={friendRequests} color="secondary">
                <Button variant="contained">
                    <GroupIcon />
                </Button>
            </Badge>
        </Link>
    </Box>
}

export default BottomNavBar;
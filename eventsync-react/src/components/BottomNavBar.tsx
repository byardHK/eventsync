import { useEffect, useState } from 'react';
import { Box, Button, Badge } from '@mui/material';
import { Link } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';
import axios from 'axios';
import { BASE_URL } from './Constants';
import { useUser } from '../sso/UserContext';
import { useLocation } from 'react-router-dom';

function BottomNavBar({ userId }: { userId: string }) {
    const [friendRequests, setFriendRequests] = useState(0);
    const { userDetails } = useUser();
    const location = useLocation();
    const currentPage = location.pathname;

    
    useEffect(() => {
        async function fetchFriendRequests() {
            if (!userDetails.email) {
                console.error('User ID is missing');
                return;  
              }
            try {
                const response = await axios.get(`${BASE_URL}/get_friend_requests/${userId}/`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                });
                setFriendRequests(response.data.friendRequestsCount);
            } catch (error) {
                console.error('Error fetching friend requests:', error);
            }
        }

        fetchFriendRequests();
    }, [userId]);

    return <Box
        display="flex"
        flexDirection="row"
        width="100%"
        // paddingBottom={2}
        // paddingTop={2}
        height="50px"
        sx={{backgroundColor: "#71A9F7"}}
        justifyContent="space-around"
        alignItems="center"
        style={{ position: 'fixed', bottom: '0' }}
    >
        <Link title="Link to Home Page" to="/home">
            {currentPage=="/home" ?
            <Box sx={{backgroundColor: "#1c284c", height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <HomeIcon style={{ color: 'white'}}/>
            </Box>
            :
            <Box sx={{height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <HomeIcon style={{ color: 'black'}}/>
            </Box>
            }
            
        </Link>
        <Link title="Link to My Events Page" to="/myEvents">
        {currentPage=="/myEvents" ?
            <Box sx={{backgroundColor: "#1c284c", height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <CalendarMonthIcon style={{ color: 'white'}}/>
            </Box>
            :
            <Box sx={{height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <CalendarMonthIcon style={{ color: 'black'}}/>
            </Box>
            }
        </Link>
        <Link to="/chatHome">
        {currentPage=="/chatHome" ?
            <Box sx={{backgroundColor: "#1c284c", height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <ChatIcon style={{ color: 'white'}}/>
            </Box>
            :
            <Box sx={{height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <ChatIcon style={{ color: 'black'}}/>
            </Box>
            }
        </Link>
        <Link to="/friends">
                {currentPage=="/friends" || currentPage=="/groups" ?
                
                <Box sx={{backgroundColor: "#1c284c", height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Badge badgeContent={friendRequests} sx={{
                        padding:1,
                        "& .MuiBadge-badge": {
                        color: "#FFFFFF",
                        backgroundColor: "#ad1f39"
                        }
                    }}>
                        <GroupIcon style={{ color: 'white'}}/>
                    </Badge>
                </Box>
                :
                <Box sx={{height:"50px", width: "75px", display:"flex", alignItems:"center", justifyContent:"center"}}>
                    <Badge badgeContent={friendRequests} sx={{
                        padding:1,
                        "& .MuiBadge-badge": {
                        color: "#FFFFFF",
                        backgroundColor: "#ad1f39"
                        }
                    }}>
                        <GroupIcon style={{ color: 'black'}}/>
                    </Badge>
                </Box>
                }
        </Link>
    </Box>
}

export default BottomNavBar;
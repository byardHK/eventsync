import Box from '@mui/material/Box';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import BottomNavBar from '../components/BottomNavBar';
import { Button } from '@mui/material';

function FriendsPage() {
//     const { userDetails } = useUser();
//     const currentUserId = userDetails.email;

//     const [users, setUsers] = useState<EventSyncUser[]>([]);
//     const [friends, setFriends] = useState<EventSyncUser[]>([]);

//     const refreshData = async () => {
//         try {
//             const [usersResponse, friendsResponse] = await Promise.all([
//                 axios.get('http://localhost:5000/get_users/'),
//                 axios.get('http://localhost:5000/get_friends/'),
//             ]);

//             setUsers(usersResponse.data);
//             setFriends(friendsResponse.data);
//         } catch (error) {
//             console.error('Error refreshing data:', error);
//         }
//     };

//     useEffect(() => {
//         refreshData();
//     }, []);
const [isFriendsPage, setIsFriendsPage] = useState<Boolean>(true); 

    const navigate = useNavigate();

    function toggleFriendsGroupPages(isFriendsPage: boolean){
        if(!isFriendsPage){
            navigate('/groupsPage');
        }
    }
    return (
        <>
            <Box display="flex" flexDirection="row">
                <Button 
                        variant={isFriendsPage ? "contained" : "outlined"} 
                        fullWidth
                        onClick={() => {toggleFriendsGroupPages(true)}}
                    >
                        Friends
                    </Button>
                    <Button 
                        variant={!isFriendsPage ? "contained" : "outlined"} 
                        fullWidth
                        onClick={() => {toggleFriendsGroupPages(false)}}
                    >
                        Groups
                    </Button>
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
            >
                <h1>Users to Friend</h1>
                {/* <UserList users={users} refreshData={refreshData} /> */}
                <h1>Friends of Current User</h1>
                {/* <FriendsList friends={friends} refreshData={refreshData} /> */}
                <BottomNavBar></BottomNavBar>
            </Box>
        </>
    );
}

// function FriendsList({ friends, refreshData }: { friends: EventSyncUser[]; refreshData: () => void }) {
//     const removeFriend = async (friendEmail: string) => {
//         try {
//             await axios.delete(`http://localhost:5000/remove_friend/${friendEmail}/`);
//             refreshData();
//         } catch (error) {
//             console.error('Error removing friend:', error);
//         }
//     };

//     return (
//         <ul>
//             {friends.map((friend, index) => (
//                 <li key={index}>
//                     {`Friend name: ${friend.fname} ${friend.lname}   Bio: ${friend.bio}`}
//                     <button onClick={() => removeFriend(friend.email)}>Remove Friend</button>
//                 </li>
//             ))}
//         </ul>
//     );
// }

// function UserList({ users, refreshData }: { users: EventSyncUser[]; refreshData: () => void }) {
//     const addFriend = async (userEmail: string) => {
//         try {
//             await axios.get(`http://localhost:5000/add_friend/${userEmail}/`);
//             refreshData();
//         } catch (error) {
//             console.error('Error adding friend:', error);
//         }
//     };

//     return (
//         <ul>
//             {users.map((user, index) => (
//                 <li key={index}>
//                     {`User name: ${user.fname} ${user.lname}   Bio: ${user.bio}`}
//                     <button onClick={() => addFriend(user.email)}>Add Friend</button>
//                 </li>
//             ))}
//         </ul>
//     );
// }

// enum NotificationFrequency {
//     None = "none",
//     Low = "low",
//     Normal = "normal",
//     High = "high",
// }

// type EventSyncUser = {
//     id: string;
//     fname: string;
//     lname: string;
//     isAdmin: boolean;
//     bio: string;
//     profilePicture: string;
//     notificationFrequency: NotificationFrequency;
//     isPublic: boolean;
//     isBanned: boolean;
//     numTimesReported: number;
//     email: string;
// };

export default FriendsPage;

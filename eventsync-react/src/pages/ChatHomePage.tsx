import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Grid2 } from '@mui/material';
import axios from 'axios';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import Chat from '../types/Chat';

// const currentUserId = "segulinWH20@gcc.edu"; // Placeholder for the current user that is logged in. TODO: get the actual current user


function ChatHomePage() {
    // console.log("my events page: ")
    // console.log(currentUserId);
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const [chats, setChats] = useState<Chat[]>([]); 

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get<Chat[]>(`http://localhost:5000/get_my_chats/${currentUserId}`);
            console.log(response);
            setChats(response.data);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    });

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <h1>My Chats</h1>
           
            <ChatList chats={chats}></ChatList>
            <BottomNavBar></BottomNavBar>
        </Box>
    </>;


};



function ChatList(props: {chats: Chat[]}) {

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '30vh', overflow: 'auto'}}
        padding={2}>
            {props.chats.map(chat =>  
                <Box display="flex" justifyContent="center" alignItems="center">
                    <h2>{chat.name}</h2>
                </Box>
            )}
                
    </Grid2>
}



export default ChatHomePage;
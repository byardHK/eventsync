import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Grid2 } from '@mui/material';
import axios from 'axios';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import Chat from '../types/Chat';
import { useNavigate } from 'react-router-dom';

function ChatHomePage() {
    

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <h1>My Chats</h1>
           
            <ChatList ></ChatList>
            <BottomNavBar></BottomNavBar>
        </Box>
    </>;


};



function ChatList() {  

    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const [chats, setChats] = useState<Chat[]>([]); 
    const navigate = useNavigate();


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
    }, []);

    function viewChat(chat: Chat) {
        navigate(`/viewChat/${chat.id}`);
    }

    return (<Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '30vh', overflow: 'auto'}}
        padding={2}>
            {chats.map(chat =>  
                <Box style={{ backgroundColor: "white"}} display="flex" justifyContent="center" alignItems="center"
                onClick={() => { viewChat(chat) }}>
                    <h2>{chat.name}</h2>
                </Box>
            )}  
    </Grid2>)
}



export default ChatHomePage;
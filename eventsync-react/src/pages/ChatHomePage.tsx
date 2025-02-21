import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Grid2 } from '@mui/material';
import axios from 'axios';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import Chat from '../types/Chat';
import { useNavigate } from 'react-router-dom';
import "../styles/chatHome.css";
import { Link } from 'react-router-dom';
import { BASE_URL } from '../components/Cosntants';


function ChatHomePage() {
    
  const { userDetails } = useUser();
  const currentUserId = userDetails.email;

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <h1>My Chats</h1>
           
            <ChatList ></ChatList>
            <BottomNavBar userId={currentUserId!}></BottomNavBar>
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
            const response = await axios.get<Chat[]>(`${BASE_URL}/get_my_chats/${currentUserId}`);
            setChats(response.data);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    return (<Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '30vh', overflow: 'auto'}}
        padding={2}>
            {chats.map(chat => 
                <Link title="Link to Home Page" to={`/viewChat/${chat.id}`}>
                  <ChatListItem chat={chat} />
                </Link>
            )}  
    </Grid2>)
}

const ChatListItem = ({chat} : { chat: Chat }) => {
    return (
        <div className="chat-list-item">
          <div className="chat-info">
            <h4>{chat.name}</h4>
            {/* <p>{chat.lastMessage}</p> */}
          </div>
          {/* <div className="timestamp">
            <span>{chat.timestamp}</span>
          </div> */}
        </div>
    );
  };



export default ChatHomePage;
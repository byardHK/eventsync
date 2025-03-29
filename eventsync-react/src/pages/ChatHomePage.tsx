import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import {InputAdornment, Paper, styled, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import "../styles/chatHome.css";
import { BASE_URL } from '../components/Constants';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import ChatDisplay from '../types/ChatDisplay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';


function ChatHomePage() {
    
  const { userDetails } = useUser();
  const currentUserId = userDetails.email;
  const [searchKeyword, setSearchKeyword] = useState('');

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            paddingBottom={2}
            style={{ position: 'fixed', top: '0', width: "100%", backgroundColor: "#1c284c"}}
        >
          <Box
            display="flex"
            alignItems="center" 
            justifyContent="center"
            padding={2}
          >
            <Typography variant="h3">My Chats</Typography>
          </Box>
              <TextField 
                sx={{backgroundColor: 'white'}}
                id="outlined-basic"
                onChange={(e) => setSearchKeyword(e.target.value)}
                slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon/>
                        </InputAdornment>
                      ),
                    },
                }}
                variant="outlined"
            />
          </Box>
          <ChatList searchKeyword={searchKeyword}></ChatList>
          <BottomNavBar userId={currentUserId!}></BottomNavBar>
    </>;
};

function ChatList({searchKeyword}: {searchKeyword: string}) {  

    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const [chats, setChats] = useState<ChatDisplay[]>([]); 
    
    const navigate = useNavigate();


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get<ChatDisplay[]>(`${BASE_URL}/get_my_chats/${currentUserId}`,{
              headers: {
                  'Authorization': `Bearer ${userDetails.token}`,
                  'Content-Type': 'application/json',
              },
          });
            setChats(response.data);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    const filteredChats = chats.filter(chat => {
      return searchKeyword
          ? chat.name.toLowerCase().includes(searchKeyword.toLowerCase())
          : true;
        });

    function viewChat (chat: ChatDisplay) {
      navigate(`/viewChat/${chat.id}`);
  }

    return (
      <Box display="flex" flexDirection="column" paddingBottom={10} paddingTop={20}>
        {filteredChats.map((chat, index) => (
          <StyledCard key={index} chat={chat} viewChat={viewChat} chatName={chat.name}></StyledCard>
        ))}
      </Box>
  );
}

function StyledCard({chat, viewChat, chatName} : {chat: ChatDisplay, viewChat: (chat:ChatDisplay) => void, chatName: String}){
  const ChatCard = styled(Paper)(({ theme }) => ({
      width: 250,
      height: 75,
      padding: theme.spacing(2),
      ...theme.typography.body2,
      textAlign: 'center',
      margin: '8px',
      backgroundColor: '#1c284c',
      color: "white"

    }));

  return (
      <Box display="flex" justifyContent="center" alignItems="center">
          <ChatCard elevation={10} square={false}>
      
      <div onClick={() => { viewChat(chat); }} style={{cursor: "pointer"}}>
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        {chat.chatType == "Group" && <GroupIcon></GroupIcon>}
        {chat.chatType == "Individual" && <PersonIcon></PersonIcon>}
        {chat.chatType == "Event" && <CalendarMonthIcon></CalendarMonthIcon>}
        <Box display="flex" flexDirection="row" justifyContent="space-between">
          <Typography variant="h5">{chatName}</Typography>
          {chat.lastMsg && chat.lastMsg.timeSent}
          </Box>
          {chat.lastMsg ? <Typography>{chat.lastMsg.messageContent}</Typography>
                    : <Typography>No messages</Typography>}
        </Box>
      </div>        
          </ChatCard>
      </Box>
  )
}

export default ChatHomePage;
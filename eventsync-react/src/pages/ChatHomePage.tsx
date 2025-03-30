import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import {InputAdornment, Paper, styled, TextField, Typography } from '@mui/material';
import axios from 'axios';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import Chat from '../types/Chat';
import "../styles/chatHome.css";
import { BASE_URL } from '../components/Constants';
import { useNavigate } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';


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
            style={{ position: 'fixed', top: '0', backgroundColor: "#1c284c", width: "100%", right: 0, left: 0, marginRight: "0", marginLeft: "auto"}}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            gap={2}
            paddingTop={2}
          >
            <Typography color="white" variant="h3">My Chats</Typography>
          </Box>
          <br></br>
              <TextField 
                sx={{backgroundColor: 'white', width: "75%"}}
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
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            paddingBottom={2}
          >
            <ChatList searchKeyword={searchKeyword}></ChatList>
            <BottomNavBar userId={currentUserId!}></BottomNavBar>
          </Box>
    </>;
};

function ChatList({searchKeyword}: {searchKeyword: string}) {  

    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const [chats, setChats] = useState<Chat[]>([]); 
    
    const navigate = useNavigate();


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get<Chat[]>(`${BASE_URL}/get_my_chats/${currentUserId}`,{
              headers: {
                  'Authorization': `Bearer ${userDetails.token}`,
                  'Content-Type': 'application/json',
              },
          });
            // const chats: Chat[] = response.data;
            // for(const chat of chats){
            //   if(!chat.isGroupChat){
            //     chat.name = 
            //   }
            // }
            // console.log(response.data);
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

    function viewChat (chat: Chat) {
      navigate(`/viewChat/${chat.id}`);
  }

    return (
      <Box display="flex" flexDirection="column" paddingBottom={7} paddingTop={18}>
        {filteredChats.map((chat, index) => (
          <StyledCard key={index} chat={chat} viewChat={viewChat} chatName={chat.name}></StyledCard>
        ))}
      </Box>
  );
}

function StyledCard({chat, viewChat, chatName} : {chat: Chat, viewChat: (chat:Chat) => void, chatName: String}){
  const ChatCard = styled(Paper)(({ theme }) => ({
      width: 300,
      height: 85,
      padding: theme.spacing(2),
      ...theme.typography.body2,
      textAlign: 'center',
      margin: '8px',
      backgroundColor: 'white',
      color: "black"

    }));

  return (
      <Box display="flex" justifyContent="center" alignItems="center">
          <ChatCard elevation={10} square={false}>
              <div onClick={() => { viewChat(chat); }} style={{cursor: "pointer"}}>
                  <Typography variant="h5" fontWeight="bold">{chatName}</Typography>
                  <br></br>
                  <Typography>{chat.chatType}</Typography>
                </div>
          </ChatCard>
      </Box>
  )
}

export default ChatHomePage;
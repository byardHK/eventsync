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
import Message from '../types/Message';
import dayjs, { Dayjs } from "dayjs";
import CircleIcon from '@mui/icons-material/Circle';


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
    const [chats, setChats] = useState<ChatDisplay[]>([]); 
    
    const navigate = useNavigate();


    useEffect(() => {
        const fetchData = async () => {
          try {
            var response = await axios.get<ChatDisplay[]>(`${BASE_URL}/get_my_chats/${currentUserId}`,{
              headers: {
                  'Authorization': `Bearer ${userDetails.token}`,
                  'Content-Type': 'application/json',
              },
          });
            for(var chat of response.data) {
              if(chat.lastMsgId && chat.lastMsgId > 0) {
                try{
                  const msgResponse = await axios.get<Message[]>(`${BASE_URL}/get_message/${chat.lastMsgId}`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                  }); 
                  chat.lastMsg = msgResponse.data[0];
              }catch(error) {
                console.error('Error fetching data:', error);
                }
            };
            }
            setChats(sortedChats(response.data));
            console.log(response);
            
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

    const sortedChats = (chats: ChatDisplay[]) => {
      const sortedChats = [...chats].sort((a, b) => {
        if(!a.lastMsg) {
          return 1
        }
        if(!b.lastMsg) {
          return 1
        }
        if (a.lastMsg.timeSent > b.lastMsg.timeSent) {
          return -1;
        }
        if (a.lastMsg.timeSent > b.lastMsg.timeSent) {
          return 1;
        }
        return 0;
      });
      return sortedChats;
    };

    function viewChat (chat: ChatDisplay) {
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

function StyledCard({chat, viewChat, chatName} : {chat: ChatDisplay, viewChat: (chat:ChatDisplay) => void, chatName: String}){
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

  function getNameStr(name: String) {
    if(name.length < 16) {
        return name
    }
    return name.substring(0, 13) + "..."
  }

  return (
      <Box display="flex" justifyContent="center" alignItems="center">
          <ChatCard elevation={10} square={false}>
      
      <div onClick={() => { viewChat(chat); }} style={{cursor: "pointer"}}>
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <Box display="flex" flexDirection="column" justifyContent="space-between">
          {chat.chatType == "Group" && <GroupIcon></GroupIcon>}
          {chat.chatType == "Individual" && <PersonIcon></PersonIcon>}
          {chat.chatType == "Event" && <CalendarMonthIcon></CalendarMonthIcon>}
          {chat.unreadMsgs == true && <CircleIcon></CircleIcon>}
        </Box>
        <Box>
        <Box display="flex" flexDirection="row" justifyContent="space-between" alignContent="left">
            <Typography align="left" fontWeight="bold" variant="h6">{getNameStr(chatName)}</Typography>
            {chat.lastMsg && <Typography>{messageDateString(chat.lastMsg.timeSent)}</Typography>}
            </Box>

            {chat.lastMsg ? <Typography>{chat.lastMsg.messageContent}</Typography> // {chat.lastMsg.messageContent}
                      : <Typography>No messages</Typography>}
          </Box>
        </Box>
      </div>        
          </ChatCard>
      </Box>
  )
}

export function messageDateString(dateStr: string) {
  const date: Dayjs = dayjs(dateStr);
  if (date.isToday()) {
      return dayjs(dateStr).format("h:mm A");
  } else if(date.year() == dayjs().year()) {
      return dayjs(dateStr).format("M/D");
  } else {
      return dayjs(dateStr).format("M/D/YY");
  }
  
}


export default ChatHomePage;
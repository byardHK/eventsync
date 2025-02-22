import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Grid2, Button, TextField, InputAdornment } from '@mui/material';
import axios from 'axios';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import Chat from '../types/Chat';
import "../styles/chatHome.css";
import { Link } from 'react-router-dom';
import { BASE_URL } from '../components/Cosntants';
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
        >
          <div className='chats-header'>
              <h1>My Chats</h1>
              <TextField 
                sx={{input: {backgroundColor: 'white'}}}
                id="outlined-basic" 
                label="Search" 
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
          </div>
           
            <ChatList searchKeyword={searchKeyword}></ChatList>
            <BottomNavBar userId={currentUserId!}></BottomNavBar>
        </Box>
    </>;


};



function ChatList({searchKeyword}: {searchKeyword: string}) {  

    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const [chats, setChats] = useState<Chat[]>([]); 

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

    const filteredChats = chats.filter(chat => {
      return searchKeyword
          ? chat.name.toLowerCase().includes(searchKeyword.toLowerCase())
          : true;
        });

    // return (<Grid2
    //     container spacing={3}
    //     display="flex"
    //     alignItems="center" 
    //     justifyContent="center"
    //     style={{maxHeight: '30vh', overflow: 'auto'}}
    //     padding={2}>
    //         {chats.map(chat => 
    //             <Link title="Link to Home Page" to={`/viewChat/${chat.id}`}>
    //               <ChatListItem chat={chat}></ChatListItem>
    //             </Link>
    //         )}  
    // </Grid2>)

    return (<ul>
    {filteredChats.length === 0 ? (
      <p>No chats found.</p>
    ) : (
      
      filteredChats.map((chat, index) => (
        <ChatListItem chat={chat}></ChatListItem>
        
      ))
    )}
  </ul>);
}

function ChatListItem ({chat} : { chat: Chat }) {

  const navigate = useNavigate();

  return(
      <Button onClick={() => navigate(`/viewChat/${chat.id}`)}>
        <li >
          <div>
            <h2>{chat.name}</h2>
            <p>Last message</p>
            <button>Open Chat</button>
          </div>
        </li>
        </Button>
  )};



export default ChatHomePage;
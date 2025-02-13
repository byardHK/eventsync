import Pusher from "pusher-js";
import { useState, useEffect } from 'react';
import axios from "axios";
import { Button, TextField, Box } from "@mui/material";
import { useUser } from '../sso/UserContext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import Message from '../types/Message';


function ChatPage(chatId: Number) {
    const { userDetails } = useUser();
    const userId = userDetails.email ? userDetails.email : "";
    const channelName = `chat-${chatId}`; // TODO: make this dynamic
    const [chats, setChats] = useState<Message[]>([]);
    const [msg, setMsg] = useState<Message>();

    const navigate = useNavigate();

    useEffect(() => {
        const pusher = new Pusher('d2b56055f7edd36cb4b6', {
            cluster: 'us2'
            //   encrypted: true,
        });
        const channel = pusher.subscribe(channelName);
        channel.bind("new-message", (data: Message) => {
            setMsg(data);
            console.log(`I got a new message! : ${data.messageContent}`);
        });
        channel.bind("pusher:subscription_succeeded", retrieveHistory);
        return () => {
            pusher.unsubscribe(channelName);
        };
    }, []);

    useEffect(() => {          
        if (msg) setChats([...chats, msg].sort((a: Message, b: Message) => {
            if (a.timeSent > b.timeSent) return -1;
            else if (a.timeSent < b.timeSent) return 1;
            else return 0;
        }));
        console.log(chats.length);
    }, [msg]);

    // function addMessage(message: Chat) {
    //     console.log(`I will set chats now: ${chats.length}; ${message.messageContent}`);
    //     setChats([...chats, message]);
    //     console.log(`Chats have been set: ${chats.length}`);

    // }

    async function retrieveHistory() {
        const response = await axios.get<ChatList>(`http://localhost:5000/messages/`);
        setChats(response.data.chats);
    }

    const handleBackClick = () => {
        navigate('/myeventspage');
    };

    return (
        <div>
            <Button onClick={handleBackClick} title="go to My Events page">
                <ArrowBackIcon />
             </Button>
            <ChatList chats={chats} userId={userId} />
            <ChatInput channelName={channelName} userId={userId} />
        </div>
    );
};


const ChatInput = (prop: { channelName: String, userId: String }) => {
    const [message, setMessage] = useState<string>("");

    const sendMessage = () => {
        // e.preventDefault(); // I should do this
        if (message.trim().length > 0) {
            var data: Message = {
                senderId: prop.userId,
                messageContent: message,
                id: -1, // TODO: how do I want to do this?
                chatId: 7,
                timeSent: getCurDate()
            };
            axios.post(`http://localhost:5000/message/`, data);
            setMessage("");
        }
    };

    return (
        <Box
        display="flex"
        flexDirection="row"
        width="100%"
        paddingBottom={2}
        paddingTop={2}
        justifyContent="space-around"
        style={{ position: 'fixed', bottom: '0', backgroundColor: 'white' }}
    >
            <TextField
                type="text"
                className="inputElement"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={sendMessage}>
                Send
            </Button>
        </Box>
    );
};

const ChatList = (prop: { chats: Message[], userId: String }) => {
    return (
        <div style={{}}>
            {prop.chats.map((chat) => {
                return (
                    <Box
                        style={{ width: '50%', display: "flex" }}
                        >
                        <Box
                            style={chat.senderId == prop.userId ? { right: '0', backgroundColor: 'white', alignItems: 'baseline'} : 
                            {   backgroundColor: '#90D5FF' }}
                            >
                            {chat.messageContent}<br></br>
                        </Box>
                    </Box>
                );
            })}
        </div>
    );
};

type ChatList = {
    chats: Message[]
}

function getCurDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} 
        ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`; 
}

export default ChatPage;

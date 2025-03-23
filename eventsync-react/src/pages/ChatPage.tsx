import {useEffect} from 'react';
import { Box, Button, Grid2, IconButton, ListItemButton, ListItemText, TextField, Typography } from "@mui/material";
import axios from "axios";
import Message from '../types/Message';
import Chat from '../types/Chat';
import { useState } from 'react';
import { useUser } from '../sso/UserContext';
import { useParams } from 'react-router-dom';
import '../styles/chat.css'
import dayjs, { Dayjs } from "dayjs";
import SendIcon from '@mui/icons-material/Send';
import isToday from 'dayjs/plugin/isToday';
import FlagIcon from '@mui/icons-material/Flag';
import chatType from '../types/chatType';
import { Link } from 'react-router-dom';
import BackButton from '../components/BackButton';

dayjs.extend(isToday);

//Pusher
import Pusher from 'pusher-js';
import { BASE_URL } from '../components/Constants';
import ReportModal from '../components/ReportModal';

function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const { chatId } = useParams<{ chatId: string }>() ;
    const [msg, setMsg] = useState<Message>();
    const [chat, setChat] = useState<Chat>();
    const [users, setUsers] = useState(new Map<String, User>())
    const { userDetails } = useUser();
    const currentUserId = userDetails.email ? userDetails.email : "";
    const channelName = `chat-${chatId}`;
    const [nonGroupOtherUser, setNonGroupOtherUser] = useState<User | null>(null);

	useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await axios.get<{chat: chatResponse, users: User[]}>(`${BASE_URL}/get_chat/${chatId}`, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setChat({
                    id: response.data.chat.id,
                    name: response.data.chat.name,
                    chatType: stringToEnum(response.data.chat.chatType)
                });
                setUsers(new Map(response.data.users.map(user => [user.id, user])));
                console.log(response.data);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchChat();

		const pusher = new Pusher('d2b56055f7edd36cb4b6', {
			cluster: 'us2'
		})
		const channel = pusher.subscribe(channelName);
		channel.bind('new-message', function(data: Message) {
            setMsg(data);
            console.log(data);
		});
        channel.bind("pusher:subscription_succeeded", retrieveHistory);
		
		return (() => {
			pusher.unsubscribe(channelName)
		})
	}, []);

    function stringToEnum(value: String): chatType {
        if (value === "Individual") {
            return chatType.INDIVIDUAL;
        } else if (value === "Group") {
            return chatType.GROUP
        } else {
            return chatType.EVENT;
        }
    }

    useEffect(() => {
        if(msg) {
            setMessages([...messages,msg]);
            console.log(messages.length);
        }
      }, [msg]);

      useEffect(() => {
        if(chat && chat.chatType == chatType.INDIVIDUAL && users) {
            for (const [userId, user] of users) {
                if (userId !== currentUserId) {
                    setNonGroupOtherUser(user);
                    break;
                }
            }
        }
      }, [chat, users]);

    async function retrieveHistory() {
        const response = await axios.get<MessageList>(`${BASE_URL}/get_chat_hist/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`,
                'Content-Type': 'application/json'
            }
        });
        setMessages(response.data.chats);
    }

    //TODO: add if statement to change chat title if logged in user is an admin
    function chatTitle() {
        if (!chat) return <div></div>;
        if (chat.chatType == chatType.INDIVIDUAL && nonGroupOtherUser) {
            return (
                <Typography variant="h3">
                    <Link to={`/profile/${nonGroupOtherUser.id}`}>
                        {getName(nonGroupOtherUser.id)}
                    </Link>
                </Typography>
            )
        }
        return <Typography variant="h4">{chat.name}</Typography>;
    }

    function getName(userId: String) {
        const user = users.get(userId);
        if (user) return `${user.fname} ${user.lname}`;
        return ""
    }

	return(
        <Grid2
            display="flex"
            flexDirection="column"
            style={{maxHeight: '85vh', overflow: 'auto'}}
            paddingTop={10}
        >
            <Box display="flex" alignItems="center" justifyContent="center" className="chat-header">
                <BackButton></BackButton>
                {chatTitle()}   
            </Box>
            <Box>
                <ChatList 
                    messages={messages} 
                    currentUserId={currentUserId} 
                    groupChat={!(chat?.chatType == chatType.INDIVIDUAL)!} 
                    getName={getName}
                >
                </ChatList>
            </Box>
            <Box>
                <ChatInput channelName={""} currentUserId={currentUserId} chatId={chatId ?? "-1"}></ChatInput>
            </Box>  
        </Grid2>
	)
}

const ChatList = ({messages, currentUserId, groupChat, getName}: { messages: Message[], currentUserId: String, groupChat: Boolean, getName: (userId: String) => String | null }) => {
    const [flagVisible, setFlagVisible] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const handleClose = () => setOpen(false);
    console.log(open);
    console.log(handleClose);
    const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

    function messageDateString(dateStr: string) {
        const date: Dayjs = dayjs(dateStr);
        if (date.isToday()) {
            return dayjs(dateStr).format("h:mm A");
        } else if(date.year() == dayjs().year()) {
            return dayjs(dateStr).format("M/D h:mm A");
        } else {
            return dayjs(dateStr).format("M/D/YY h:mm A");
        }
        
    }

    function otherChat(message : Message){
        return <ListItemButton onClick={() => setFlagVisible(!flagVisible)} className="other">
                <div className="msg">
                    <ReportModal input={message} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="message"/>
                    {groupChat && <p>{getName(message.senderId)}</p>}
                    {flagVisible ? (
                        <div>
                            <Box display="flex" justifyContent="flex-end">
                                <IconButton onClick={()=>setReportModalOpen(true)}>
                                    <FlagIcon style={{ color: '#ad1f39'}}></FlagIcon>
                                </IconButton>
                            </Box>
                            <ListItemText>{message.messageContent}</ListItemText>
                            <div className="date">{messageDateString(message.timeSent)}</div>
                        </div>
                    ) : (
                        <div>
                            <ListItemText className="message">{message.messageContent}</ListItemText>
                            <div className="date">{messageDateString(message.timeSent)}</div>
                        </div>
                    )}
            
                </div>
            </ListItemButton>
    }

    return (       
        <div className="chatWindow">
            <ul className='chat' id='chatList'>
            {messages.map((message, index) => (
            <div key={index}>
                {currentUserId === message.senderId ? (
                <ListItemButton className="self">
                    <div className="msg">
                        <ListItemText className="message">{message.messageContent}</ListItemText>
                        <div className="date">{messageDateString(message.timeSent)}</div>

                    </div>
                </ListItemButton>
              ) : (
                otherChat(message)
              )}
            </div>
            ))}
            </ul>
        </div>)
};


const ChatInput = (props: { channelName: String, currentUserId: String, chatId: string }) => {
    const [message, setMessage] = useState<string>("");
    const {userDetails} = useUser();

    const sendMessage = () => {
        if (message.trim().length > 0) {
            const data = {
                senderId: props.currentUserId,
                messageContent: message,
                id: -1,
                chatId: props.chatId,
                timeSent: getCurDate()
            };
            axios.post(`${BASE_URL}/message/`, data, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            setMessage("");
        }
    };

    return (
        <div>
            <div className="chat-input-container">
            <TextField 
                type="text" 
                value={message} 
                onChange={(event) => setMessage(event.target.value)}  
            />
            <Button onClick={sendMessage}>
                <SendIcon></SendIcon>
            </Button>
        </div>
      </div>
    );
};

export function getCurDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`; 
}

type MessageList = {
    chats: Message[]
}

type User = {
    id: String,
    fname: String,
    lname: String
}

type chatResponse = {
    id: Number,
    name: String,
    chatType: String,
}

export default ChatPage;

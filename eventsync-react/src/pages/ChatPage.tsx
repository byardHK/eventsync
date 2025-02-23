import {useEffect} from 'react';
import { Box, Button, Dialog, IconButton, ListItemButton, ListItemText, TextField } from "@mui/material";
import axios from "axios";
import Message from '../types/Message';
import Chat from '../types/Chat';
import { useState } from 'react';
import { useUser } from '../sso/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../styles/chat.css'
import dayjs, { Dayjs } from "dayjs";
import SendIcon from '@mui/icons-material/Send';
import isToday from 'dayjs/plugin/isToday';
import FlagIcon from '@mui/icons-material/Flag';

dayjs.extend(isToday);

//Pusher
import Pusher from 'pusher-js';
import { BASE_URL } from '../components/Cosntants';
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
    const navigate = useNavigate();
    const [nonGroupOtherUser, setNonGroupOtherUser] = useState<User | null>(null);

	useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await axios.get<{chat: Chat, users: User[]}>(`http://localhost:5000/get_chat/${chatId}`);
                setChat(response.data.chat);
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

    useEffect(() => {
        if(msg) {
            setMessages([...messages,msg]);
            console.log(messages.length);
        }
      }, [msg]);

      useEffect(() => {
        if(chat && !chat.isGroupChat && users) {
            for (const [userId, user] of users) {
                if (userId !== currentUserId) {
                    setNonGroupOtherUser(user);
                    break;
                }
            }
        }
      }, [users]);

    async function retrieveHistory() {
        const response = await axios.get<MessageList>(`${BASE_URL}/get_chat_hist/${chatId}`);
        setMessages(response.data.chats);
    }

    const handleBackClick = () => {
        navigate('/chatHome');
    };

    function chatTitle(): String {
        if (!chat) return "";
        if (chat.isGroupChat) return chat.name;
        return `${nonGroupOtherUser?.fname} ${nonGroupOtherUser?.lname}`
    }

    function getName(userId: String) {
        const user = users.get(userId);
        if (user) return `${user.fname} ${user.lname}`;
        return null
    }

	return(
		<div className="chat-container">

             <div className="chat-header"> 
             <Button className='arrow' onClick={handleBackClick} title="go to My Events page">
                    <ArrowBackIcon style={{ color: 'white'}} />
                </Button> 
                <h2>{chatTitle()}</h2>     
            </div>
            <ChatList messages={messages} currentUserId={currentUserId} groupChat={chat?.isGroupChat!} getName={getName}></ChatList>
            <ChatInput channelName={""} currentUserId={currentUserId} chatId={chatId ?? "-1"}></ChatInput>
		</div>
	)
}

const ChatList = ({messages, currentUserId, groupChat, getName}: { messages: Message[], currentUserId: String, groupChat: Boolean, getName: (userId: String) => String | null }) => {
    const [flagVisible, setFlagVisible] = useState<boolean>(false);
    const [open, setOpen] = useState(false);
    const handleClose = () => setOpen(false);
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

    // function handleClick(){
    //     return <Dialog 
    //         onClose={handleClose} 
    //         open={open} 
    //     >
    //         <IconButton onClick={()=>setReportModalOpen(true)}>
    //             <FlagIcon style={{ color: 'red'}}></FlagIcon>
    //         </IconButton>
    //     </Dialog>
    // }

    function otherChat(message : Message){
        return <ListItemButton onClick={() => setFlagVisible(!flagVisible)} className="other">
                <div className="msg">
                    <ReportModal input={message} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="message"/>
                    {groupChat && <p>{getName(message.senderId)}</p>}
                    {flagVisible ? (
                        <div>
                            <Box display="flex" justifyContent="flex-end">
                                <IconButton onClick={()=>setReportModalOpen(true)}>
                                    <FlagIcon style={{ color: 'red'}}></FlagIcon>
                                </IconButton>
                            </Box>
                            <ListItemText className="message">{message.messageContent}</ListItemText>
                            <ListItemText className="date">{messageDateString(message.timeSent)}</ListItemText>
                        </div>
                    ) : (
                        <div>
                            <ListItemText className="message">{message.messageContent}</ListItemText>
                            <ListItemText className="date">{messageDateString(message.timeSent)}</ListItemText>
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
                        <ListItemText className="date">{messageDateString(message.timeSent)}</ListItemText>

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

    const sendMessage = () => {
        if (message.trim().length > 0) {
            const data = {
                senderId: props.currentUserId,
                messageContent: message,
                id: -1, // TODO: how do I want to do this?
                chatId: props.chatId,
                timeSent: getCurDate()
            };
            axios.post(`${BASE_URL}/message/`, data);
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

function getCurDate() {
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

export default ChatPage;

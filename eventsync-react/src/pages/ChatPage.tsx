import {useEffect} from 'react';
import { Button, TextField } from "@mui/material";
import axios from "axios";
import Message from '../types/Message';
import Chat from '../types/Chat';
import { useState } from 'react';
import { useUser } from '../sso/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../styles/chat.css'
import dayjs, { Dayjs } from "dayjs";


//Pusher
import Pusher from 'pusher-js';

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


	//This will be called when your component is mounted
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
		// You can bind more channels here like this
		// const channel2 = pusher.subscribe('channel_name2')
		channel.bind('new-message', function(data: Message) {
            setMsg(data);
            console.log(data);
		    // Code that runs when channel1 listens to a new message
		});
        channel.bind("pusher:subscription_succeeded", retrieveHistory);
		
		return (() => {
			pusher.unsubscribe(channelName)
			// pusher.unsubscribe('channel_name2')
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	// [] would ensure that useEffect is executed only once

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
        const response = await axios.get<MessageList>(`http://localhost:5000/get_chat_hist/${chatId}`);
        setMessages(response.data.chats);
    }

    const handleBackClick = () => {
        navigate('/chatHomePage');
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

    function messageDateString(dateStr: string) {
        return dayjs(dateStr).format("h:mm A")
    }

    return (       
        <div className="chatWindow">
            <ul className='chat' id='chatList'>
            {messages.map((message, index) => (
            <div key={index}>
                {currentUserId === message.senderId ? (
                <li className="self">
                  <div className="msg">
                    <div className="message"> {message.messageContent}</div>
                    <div className='date'>{messageDateString(message.timeSent)}</div>
                  </div>
                </li>
              ) : (
                <li className="other">
                  <div className="msg">
                    {groupChat && <p>{getName(message.senderId)}</p>}
                    <div className="message"> {message.messageContent}</div>
                    <div className='date'>{messageDateString(message.timeSent)}</div>
                  </div>
                </li>
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
            axios.post(`http://localhost:5000/message/`, data);
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
          <button onClick={sendMessage}>Send</button>
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

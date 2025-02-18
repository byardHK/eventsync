import {useEffect} from 'react';
import { Button, TextField, Box } from "@mui/material";
import axios from "axios";
import Message from '../types/Message';
import { useState } from 'react';
import { useUser } from '../sso/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import '../styles/chat.css'

//Pusher
import Pusher from 'pusher-js';

function ChatPage() {
    const [chats, setChats] = useState<Message[]>([]);
    const { chatId } = useParams<{ chatId: string }>() ;
    const [msg, setMsg] = useState<Message>();
    const { userDetails } = useUser();
    const userId = userDetails.email ? userDetails.email : "";
    const channelName = `chat-${chatId}`;
    const navigate = useNavigate();


	//This will be called when your component is mounted
	useEffect(() => {
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
            setChats([...chats,msg]);
            console.log(chats.length);
        }
      }, [msg]);

    async function retrieveHistory() {
        const response = await axios.get<MessageList>(`http://localhost:5000/get_chat_hist/${chatId}`);
        setChats(response.data.chats);
    }

    const handleBackClick = () => {
        navigate('/chatHomePage');
    };

	return(
		<div className="chat-container">
            
             <div className="chat-header">
                <Button  onClick={handleBackClick} title="go to My Events page">
                    <ArrowBackIcon style={{ color: 'white'}} />
                </Button>
                {/* <h2>{chat}</h2> */}
            </div>
            <ChatList messages={chats} userId={userId}></ChatList>
            <ChatInput channelName={""} userId={userId} chatId={chatId ?? "-1"}></ChatInput>
		</div>
	)
}

const ChatList = (props: { messages: Message[], userId: String }) => {
    return (       
        <div className="messages-container">
            {props.messages.map((message, index) => (
            <div>
                <div
                    // style={{alignSelf: 'flex-start'}}
                    key={index}
                    className={`message ${message.senderId === props.userId ? "user" : "bot"}`}
                >
                    <p>{message.messageContent}</p>
                </div>
                <br></br>
            </div>
            ))}
        </div>)
};

const ChatInput = (props: { channelName: String, userId: String, chatId: string }) => {
    const [message, setMessage] = useState<string>("");

    const sendMessage = () => {
        // e.preventDefault(); // I should do this
        if (message.trim().length > 0) {
            const data = {
                senderId: props.userId,
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

export default ChatPage;


import Pusher from "pusher-js";
import { useState, useEffect } from 'react';
import axios from "axios";
import { Button, TextField } from "@mui/material";

function ChatPage() {
    const channelName = "chat-channel";
    const user = "harnlyam20@gcc.edu"; // TODO: change these defaults
    const [chats, setChats] = useState<Chat[]>([]);
    const [msg, setMsg] = useState<Chat>();

    useEffect(() => {
        const pusher = new Pusher('d2b56055f7edd36cb4b6', {
            cluster: 'us2'
            //   encrypted: true,
        });
        const channel = pusher.subscribe(channelName);
        channel.bind("new-message", (data: Chat) => {
            setMsg(data);
            console.log(`I got a new message! : ${data.messageContent}`);
        });
        channel.bind("pusher:subscription_succeeded", retrieveHistory);
        return () => {
            pusher.unsubscribe(channelName);
        };
    }, []);

    useEffect(() => {
        if (msg) setChats([...chats, msg]);
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

    return (
        <div>
            <ChatList chats={chats} user={user} />
            <ChatInput channelName={channelName} user={user} />
        </div>
    );
};


const ChatInput = (prop: { channelName: String, user: String }) => {
    const [message, setMessage] = useState<string>("");

    const sendMessage = () => {
        // e.preventDefault(); // I should do this
        if (message.trim().length > 0) {
            var data: Chat = {
                senderId: prop.user,
                messageContent: message,
                id: -1, // TODO: how do I want to do this?
                chatId: 7,
                timeSent: "2025-02-08 17:02:00" // TODO: get current time???
            };
            axios.post(`http://localhost:5000/message/`, data);
            setMessage("");
        }
    };

    return (
        <div>
            <TextField
                type="text"
                className="inputElement"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />
            <Button onClick={sendMessage}>
                Send
            </Button>
        </div>
    );
};

const ChatList = (prop: { chats: Chat[], user: String }) => {
    return (
        <div>
            {prop.chats.map((chat) => {
                return (
                    <div>{chat.messageContent} ({chat.senderId})</div>
                );
            })}
        </div>
    );
};

type Chat = {
    id: Number;
    chatId: Number;
    senderId: String;
    messageContent: String;
    timeSent: String;
}

type ChatList = {
    chats: Chat[]
}

export default ChatPage;

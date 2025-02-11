
import Pusher from "pusher-js";
import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Button, TextField } from "@mui/material";

function ChatPage() {
    const channelName = "chat-channel";
    const user = "Allison"; // TODO: change these defaults
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
        });
        return () => {
            pusher.unsubscribe(channelName);
        };
    }, []);

    useEffect(() => {
        if (msg) setChats([...chats, msg]);
    }, [msg]);

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
            let data: Chat = {
                user: prop.user,
                text: message,
            };
            axios.post(`http://localhost:5000/message/`, data);
            setMessage("")
        }
    };

    return (
        <div>
            <TextField
                type="text"
                className="inputElement"
                value={message}
                onChange={(e) => { setMessage(e.target.value); console.log(`${e.target.value}`) }}
            />
            <Button onClick={e => sendMessage(e)}>
                Send
            </Button>
        </div>
    );
};

const ChatList = (prop: { chats: Chat[], user: String }) => {
    return (
        <div className="chatsContainer">
            {prop.chats.map((chat) => {
                console.log(chat.text);
                return (
                    <div className={chat.user === prop.user ? "divRight" : "divLeft"}>
                        <div
                            className={
                                chat.user === prop.user
                                    ? " commonStyle myChatContainer "
                                    : "commonStyle chatContainer"
                            }
                            key={Math.random()}
                        >
                            {chat.user !== prop.user && (
                                <div className="msgAuthor">{chat.user}</div>
                            )}
                            <div>{chat.text}</div>
                        </div>

                        <div
                            className={
                                chat.user === prop.user
                                    ? "arrowRight arrow"
                                    : "arrowLeft arrow"
                            }
                        ></div>
                    </div>
                );
            })}
        </div>
    );
};

type Chat = {
    user: String;
    text: String
}

export default ChatPage;

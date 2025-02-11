
import Pusher from "pusher-js";
import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Button, TextField } from "@mui/material";

function ChatPage() {
    const channelName = "chat-channel";
    const userName = "Allison";

    const [chats, setChats] = useState([]);
    const [msg, setMsg] = useState();

    useEffect(() => {
        const pusher = new Pusher('d2b56055f7edd36cb4b6', {
            cluster: 'us2'
            //   encrypted: true,
        });
        const channel = pusher.subscribe(channelName);
        channel.bind("new-message", (data: Chat) => {
            console.log(`new message: ${data.text}`);
            setMsg(data);
            console.log(`messages: ${msg.text}`);
        });
        return () => {
            pusher.unsubscribe(channelName);
        };
    }, []);

    useEffect(() => {
        if (msg) setChats([...chats, msg]);
        console.log(chats.length);
    }, [msg]);

    return (
        <div className="wrapper">
            <div className="container">
                <div className="userProfile">Hello, {userName}</div>
                <ChatList chats={chats} username={userName} />
                <ChatInput channelName={channelName} username={userName} />
            </div>
        </div>
    );
};


const ChatInput = (prop: { channelName: String, username: String }) => {
    const [message, setMessage] = useState<string>("");
    const [showErr, setShowErr] = useState<Boolean>(false);

    const sendMessage = (e) => {
        e.preventDefault();
        console.log(`sending message: ${message}`);
        if (message.trim().length > 0) {
            let data = {
                user: prop.username,
                text: message,
            };
            setShowErr(false);
            axios
                .post(`http://localhost:5000/message/`, data)
                .then(() => {
                    setMessage("");
                });
        } else setShowErr(true);
    };

    return (
        <div>
            {/* // <form className="inputContainer" onSubmit={(e) => sendMessage(e)}> */}
            <TextField
                type="text"
                className="inputElement"
                value={message}
                onChange={(e) => { setMessage(e.target.value); console.log(`${e.target.value}`) }}
            />
            <Button className="inputBtn" type="submit" onClick={sendMessage}>
                Send
            </Button>
            {/* //   {showErr && <div className="errorText">Enter your message</div>}
    // </form> */}
        </div>
    );
};

const ChatList = (prop: { chats: Chat[], username: String }) => {
    return (
        <div className="chatsContainer">
            {prop.chats.map((chat) => {
                console.log(chat.text);
                return (
                    <div className={chat.username === prop.username ? "divRight" : "divLeft"}>
                        <div
                            className={
                                chat.username === prop.username
                                    ? " commonStyle myChatContainer "
                                    : "commonStyle chatContainer"
                            }
                            key={Math.random()}
                        >
                            {chat.username !== prop.username && (
                                <div className="msgAuthor">{chat.username}</div>
                            )}
                            <div>{chat.text}</div>
                        </div>

                        <div
                            className={
                                chat.username === prop.username
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
    username: String;
    text: String
}

export default ChatPage;

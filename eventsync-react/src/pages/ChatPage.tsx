import {useEffect} from 'react';
import { Box, Button, Grid2, IconButton, FormControl, Input, ListItemButton, ListItemText, TextField, Typography } from "@mui/material";
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
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useRef } from 'react';
import ClearIcon from '@mui/icons-material/Clear';

dayjs.extend(isToday);

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

    async function msgSeen(msg_id: number) {
        if(chat) {
        console.log(chat?.chatType);
          try {
            const data = {
              user_id: userDetails.email,
              chat_id: chatId,
              msg_id: msg_id,
              chat_type: chat?.chatType
            }
            await axios.post(`${BASE_URL}/update_msg_last_seen/`, data, {
              headers: {
                  'Authorization': `Bearer ${userDetails.token}`,
                  'Content-Type': 'application/json',
              },
          });
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        } else {
            console.log("Could not update last message seen. Chat type is undefined.");
        }
    }

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
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchChat();

		const pusher = new Pusher('d2b56055f7edd36cb4b6', {
			cluster: 'us2'
		})
		const channel = pusher.subscribe(channelName);
		channel.bind('new-message', async function(newMsg: Message) {
            setMsg(newMsg);
            msgSeen(newMsg.id);
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

      useEffect(() => {
        if(chat && messages && messages.length > 0) {
            msgSeen(messages[messages.length - 1].id);
        }
      }, [messages, chat]);

    async function retrieveHistory() {
        const response = await axios.get<MessageList>(`${BASE_URL}/get_chat_hist/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`,
                'Content-Type': 'application/json'
            }
        });
        const msgs = response.data.chats
        setMessages(msgs);
    }

    //TODO: add if statement to change chat title if logged in user is an admin
    function chatTitle() {
        if (!chat) return <div></div>;
        if (chat.chatType == chatType.INDIVIDUAL && nonGroupOtherUser) {
            return (
                <Typography align="center" fontWeight="bold" color="white" variant="h5">
                    <Link style={{color:"#71A9F7"}} to={`/profile/${nonGroupOtherUser.id}`}>
                        {getName(nonGroupOtherUser.id)}
                    </Link>
                </Typography>
            )
        }
        return <Typography fontWeight="bold" color="white" variant="h5" textAlign="center">{chat.name}</Typography>;
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
            style={{maxHeight: '89vh', overflow: 'auto'}}
            paddingTop={10}
        >
            <Box display="flex" flexDirection="row" alignItems="center" justifyContent="flex-start" className="chat-header" sx={{ borderBottom: "solid", borderBottomColor: "#FFFFFF", borderBottomWidth: "1px"}} style={{ position: 'fixed', paddingTop: "10px", backgroundColor: "#1c284c", width: "100%", right: 0, left: 0, marginRight: "0", marginLeft: "auto"}}>
                <BackButton/>
                {chatTitle()}
            </Box>
            <ChatList 
                messages={messages} 
                currentUserId={currentUserId} 
                groupChat={!(chat?.chatType == chatType.INDIVIDUAL)!} 
                getName={getName}
            >
            </ChatList>
            <ChatInput channelName={""} currentUserId={currentUserId} chatId={chatId ?? "-1"}></ChatInput>
        </Grid2>
	)
}

const ChatList = ({messages, currentUserId, groupChat, getName}: { messages: Message[], currentUserId: String, groupChat: Boolean, getName: (userId: String) => String | null}) => {
    const [flaggedMessageId, setFlaggedMessageId] = useState<number | undefined>();
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

    function otherChat(message : Message, flagVisible: boolean, onClick: () => void){
        return <ListItemButton onClick={onClick} className="other">
                <div className="msg">
                    <ReportModal input={message} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="message"/>
                    {groupChat && <p>{getName(message.senderId)}</p>}
                    <div>
                    <ListItemText className="message">{message.messageContent}</ListItemText>
                        {message.id && message.imagePath &&
                        <div>
                            <ImageComponent id={message.id} />
                        </div>
                        }
                        <div className="date">{messageDateString(message.timeSent)}</div>
                    </div>
                </div>
                {flagVisible ?
                    <IconButton onClick={()=>setReportModalOpen(true)}>
                        <FlagIcon style={{ color: '#ad1f39'}}></FlagIcon>
                    </IconButton> :
                    <></>
                }
            </ListItemButton>
    }

    return (
        <Box>
            {messages.map((message, index) => (
                <div key={index}>
                {currentUserId === message.senderId ? (
                <ListItemButton className="self">
                    <div className="msg">
                        <ListItemText className="message">{message.messageContent}</ListItemText>
                        {message.id && message.imagePath &&
                        <div>
                            <ImageComponent id={message.id} />
                        </div>
                        }
                        <div className="date">{messageDateString(message.timeSent)}</div>

                    </div>
                </ListItemButton>
                ) : (
                    otherChat(message, flaggedMessageId === message.id, () => {
                        setFlaggedMessageId(flaggedMessageId === message.id ? undefined : message.id);
                    })
                )}
                </div>
            ))}
        </Box>
    )
}


const ChatInput = (props: { channelName: String, currentUserId: string, chatId: string }) => {
    const [message, setMessage] = useState<string>("");
    const {userDetails} = useUser();
    const [selectedImage, setSelectedImage] = useState<File | undefined>();

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

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if(!event.target.files) {
            return;
        }
        
        setSelectedImage(event.target.files[0]);
    }

    const handleUpload = async () => {
        if(!selectedImage) {
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('senderId', props.currentUserId);
        formData.append('chatId', props.chatId);
        formData.append('timeSent', getCurDate());
        formData.append('imageType', selectedImage.type ?? 'image/heic');

        try {
            await axios.post(`${BASE_URL}/upload/`, formData, {
              headers: {
                'Authorization': `Bearer ${userDetails.token}`,
                'Content-Type': 'multipart/form-data',
              },
            });
        } catch (error) {
            console.error('Error uploading image:', error);
        }
        setSelectedImage(undefined)
    };

    const onSend = () => {
        sendMessage();
        handleUpload();
    }

    const hiddenFileInput = useRef<HTMLDivElement>(null);

    const handleClick = () => {
        if (selectedImage) {
            setSelectedImage(undefined)
        }
        else if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    }

    return <Box 
        display="flex"
        width="100%"
        sx={{
            backgroundColor: "#1c284c",
            position: "fixed",
            left: "0px",
            bottom: "0px",
            paddingBottom: "10px",
            paddingTop: "10px"
        }}
    >
        <Button onClick={handleClick} sx={{backgroundColor: "#71A9F7"}}>
            {selectedImage ? <ClearIcon sx={{color: "#1c284c"}}></ClearIcon> :  <AttachFileIcon sx={{color: "#1c284c"}}></AttachFileIcon>}
        </Button>
        <FormControl>
            <Input 
                type="file" 
                onChange={handleImageChange}
                inputRef={hiddenFileInput}
                style={{display:'none'}}
                inputProps={{accept: "image/heic, image/jpeg, image/png" }}
            />
        </FormControl>
        <TextField 
            type="text" 
            // multiline
            // maxRows={2}
            value={message} 
            onChange={(event) => setMessage(event.target.value)}
            sx={{backgroundColor: "#FFFFFF"}}
            fullWidth
        />
            
        <Button onClick={onSend} sx={{backgroundColor: "#71A9F7"}}>
            <SendIcon sx={{color: "#1c284c"}}></SendIcon>
        </Button>
    </Box>;
};

const ImageComponent = ({id} : {id: number}) => {
    const [imageURL, setImageURL] = useState<string>();
    const { userDetails } = useUser();

    async function importImage() {
        try {
            const response = await axios.get<string>(`${BASE_URL}/get_image/${id}/`,  {
                responseType: 'blob',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                }
            });
            const blob = new Blob([response.data], { type: 'image/jpeg' });
            setImageURL(URL.createObjectURL(blob));
        }catch (error) {
            console.error('Error retrieving image:', error);
        }
    }

    useEffect(() => {
        importImage()

        return () => {
            if (imageURL) {
              URL.revokeObjectURL(imageURL);
            }
          };
      }, []);

    return (
      <Box
        component="img"
        sx={{
          maxHeight: '100%',
          maxWidth: '100%',
        }}
        alt="Image in chat"
        src={imageURL}
      />    
    );
  };

export function getCurDateGMT() {
    const date = new Date();
    date.setHours(date.getHours() + 4);
    return formatDate(date);    
}

export function getCurDate() {
    return formatDate(new Date());
}

function formatDate(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`; 

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

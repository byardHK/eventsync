import {useEffect} from 'react';
import { Box, Button, Grid2, Input, IconButton, ListItemButton, ListItemText, TextField, InputLabel, FormControl } from "@mui/material";
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

dayjs.extend(isToday);

//Pusher
import Pusher from 'pusher-js';
import { BASE_URL } from '../components/Constants';
import ReportModal from '../components/ReportModal';
const imageDirectory = "../../../eventsync-backend/uploads/";

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
    const [importedImages, setImportedImages] = useState<string[]>([])

	useEffect(() => {
        const fetchChat = async () => {
            try {
                const response = await axios.get<{chat: chatResponse, users: User[]}>(`http://localhost:5000/get_chat/${chatId}`, {
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
                <h1>
                <Link to={`/profile/${nonGroupOtherUser.id}`}>
                    {getName(nonGroupOtherUser.id)}
                </Link>
                </h1>
            )
        }
        return <h2>{chat.name}</h2>;
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
                                    <FlagIcon style={{ color: 'red'}}></FlagIcon>
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
            {/* <ul className='chat' id='chatList'>
                {MyComponent('0')} */}
            {messages.map((message, index) => (
                <div key={index}>
                {currentUserId === message.senderId ? (
                <ListItemButton className="self">
                    <div className="msg">
                        <ListItemText className="message">{message.messageContent}</ListItemText>
                        {message.id && message.imagePath &&
                        <div>
                            <ImageComponent 
                                id={message.id} fileExtension={message.imagePath}/>
                        </div>
                        }
                        <div className="date">{messageDateString(message.timeSent)}</div>

                    </div>
                </ListItemButton>
                ) : (
                    otherChat(message)
                )}
                </div>
            ))}
        </div>
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

        try {
            const response = await axios.post('http://localhost:5000/upload', formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            console.log(response.data);
            // Handle success (e.g., display success message, image preview)
        } catch (error) {
            console.error('Error uploading image:', error);
            // Handle error (e.g., display error message)
        }
    };

    const onSend = () => {
        sendMessage();
        handleUpload();
    }

    const hiddenFileInput = useRef<HTMLDivElement>(null);

    const handleClick = () => {
        if (hiddenFileInput.current) {
            hiddenFileInput.current.click();
        }
    }


    return (
        <div>
        <div className="chat-input-container">

        <Button onClick={handleClick}>
            <AttachFileIcon></AttachFileIcon>
        </Button>
        <FormControl>
            <Input 
                type="file" 
                onChange={handleImageChange}
                inputRef={hiddenFileInput}
                style={{display:'none'}}
                inputProps={{accept: "image/*" }}
            />
        </FormControl>
        <TextField 
            type="text" 
            // multiline
            // maxRows={2}
            value={message} 
            onChange={(event) => setMessage(event.target.value)}  
        />
        <Button onClick={onSend}>
            <SendIcon></SendIcon>
        </Button>
        
        <div>
            
        </div>
        </div>
      </div>
    );
};

const ImageComponent = ({id, fileExtension} : {id: number, fileExtension: string}) => {
    // const fullPath = `../../../uploads/${imagePath}`;
    // const fullPath = '../../../eventsync-backend/uploads/0.jpg';
    // const fullPath = '../uploads/0.jpg';
    const [imageRef, setImageRef] = useState<string>();
    const imageName = id.toString();

    useEffect(() => {
        importImage()
      }, []);

//   console.log(fs.existsSync(fullPath));
    
    // TODO: if image has not already been imported...
    async function importImage() {
        console.log(`../../../eventsync-backend/uploads/${imageName}.jpg`);
        const imageImport = await import(`../../../eventsync-backend/uploads/${imageName}.jpg`);
            // setImageRef(imageImport);
            // .catch(() => console.log(`I could not import this`)); // TODO: an image when no image is found
        setImageRef(imageImport.default);
        console.log(imageImport.default);
    }
    

    return (
      <Box
        component="img"
        sx={{
          height: 233,
          width: 350,
          maxHeight: { xs: 200, md: 167 },
          maxWidth: { xs: 350, md: 250 },
        }}
        alt="Image in chat"
        src={imageRef ? imageRef : ""}
      />
    
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

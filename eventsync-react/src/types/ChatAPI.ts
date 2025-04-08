import chatType from "./chatType";


interface ChatAPI {
    myChatId: Number,
    name: String,
    chatType: chatType,
    unreadMsgs: Boolean,
    lastMsgId: number | null,
    id: number,
    chatId: string,
    groupId: number, 
    senderId: string,
    messageContent: string | null,
    imagePath: string | null,
    timeSent: string
}
export default ChatAPI;
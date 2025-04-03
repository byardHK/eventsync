import Chat from "./Chat";

interface ChatDisplay extends Chat {
    unreadMsgs: Boolean,
    lastMsgId: number | null,
    senderId: string,
    messageContent: string | null,
    imagePath: string | null,
    timeSent: string
}
export default ChatDisplay;
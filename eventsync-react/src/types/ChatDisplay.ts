import Message from "./Message";
import Chat from "./Chat";

interface ChatDisplay extends Chat {
    unreadMsgs: Boolean,
    lastMsg: Message | null,
    lastMsgId: number | null
}
export default ChatDisplay;
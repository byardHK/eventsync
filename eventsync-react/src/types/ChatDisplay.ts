import Message from "./Message";
import Chat from "./Chat";

interface ChatDisplay extends Chat {
    unreadMsgs: Boolean,
    lastMsg: Message | null
}
export default ChatDisplay;
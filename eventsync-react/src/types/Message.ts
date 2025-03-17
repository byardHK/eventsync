type Message = {
    id: number,
    senderId: string,
    messageContent: string | null,
    imagePath: string | null,
    groupId: number, 
    chatId: string,
    timeSent: string
};

export default Message;
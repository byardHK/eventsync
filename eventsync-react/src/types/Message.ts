type Message = {
    id: number,
    senderId: string,
    messageContent: string | null,
    imagePath: string | null,
    chatId: string,
    timeSent: string
};

export default Message;
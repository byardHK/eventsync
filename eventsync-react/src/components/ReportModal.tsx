import { Box, Button, Dialog, TextField } from "@mui/material";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { Event } from "../pages/ViewEventPage";
import Tag from "../types/Tag";
import axios from "axios";
import { useUser } from "../sso/UserContext";
import User from "../types/User";
import Message from "../types/Message";
import { BASE_URL } from "./Cosntants";

type ReportModalProps = {
    input: Event | Tag | User | Message;
    open: boolean;
    onClose: () => void;
    type: "event" | "tag" | "user" | "message";
};

async function reportEvent(event: Event, currentUserId: string, reportDetails: string) {
    try {
        const response = await axios.post(`${BASE_URL}/reportEvent`, {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedEventId: event.id
        });
    } catch (error) {
        console.error('Error:', error);
        alert('report failed');
    }
};

async function reportMessage(message: Message, currentUserId: string, reportDetails: string) {
    try {
        const response = await axios.post(`${BASE_URL}/reportMessage`, {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedMessageId: message.id
        });
    } catch (error) {
        console.error('Error:', error);
        alert('report failed');
    }
};

function ReportModal({input, open, onClose, type}: ReportModalProps){
    const [reportText, setReportText] = useState<string>("");
    const { userDetails } = useUser();

    function onSubmit(){
        if(type === "event"){
            reportEvent(input as Event, userDetails.email!, reportText);
        }
        if(type === "message"){
            reportMessage(input as Message, userDetails.email!, reportText);
        }
    }


    return <>
        <Dialog 
            onClose={onClose}
            open={open}
        >
            <Box
                display="flex"
                flexDirection="column"
                sx={{padding: 3}}
            >
                <p>Please add more details of what you would like to report: </p>
                <TextField
                    sx={{input: {backgroundColor: 'white'}}}
                    id="outlined-basic"
                    variant="outlined" 
                    type="text" 
                    multiline
                    maxRows={4}
                    value={reportText} 
                    onChange={(event) => setReportText(event.target.value)}
                />
                <Box
                    display="flex"
                    flexDirection="row"
                    gap={3}
                >
                    <Button variant="outlined" fullWidth onClick={onClose}>Cancel</Button>
                    <Button variant="outlined" fullWidth onClick={onSubmit}>Save</Button>
                </Box>
            </Box>
        </Dialog>
    </>
}

export default ReportModal
import { Box, Button, Dialog, TextField } from "@mui/material";
import { useState } from "react";
import AddIcon from '@mui/icons-material/Add';
import { Event } from "../pages/ViewEventPage";
import Tag from "../types/Tag";
import axios from "axios";
import { useUser } from "../sso/UserContext";
import User from "../types/User";
import Message from "../types/Message";

type ReportModalProps = {
    input: Event | Tag | User | Message;
    open: boolean;
    onClose: () => void;
    type: "event" | "tag" | "user" | "message";
};

async function reportEvent(event: Event, currentUserId: string, reportDetails: string) {
    try {
        const response = await axios.post('http://localhost:5000/reportEvent', {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedEventId: event.id
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
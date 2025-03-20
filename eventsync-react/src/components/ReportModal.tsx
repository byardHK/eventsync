import { Box, Button, Dialog, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { Event } from "../pages/ViewEventPage";
import Tag from "../types/Tag";
import axios from "axios";
import { useUser } from "../sso/UserContext";
import User from "../types/User";
import Message from "../types/Message";
import { Group } from "../pages/GroupsPage";
import { BASE_URL } from "./Constants";

type ReportModalProps = {
    input: Event | Tag | User | Message | Group | undefined;
    open: boolean;
    onClose: () => void;
    type: "event" | "tag" | "user" | "message" | "group";
};

async function reportEvent(event: Event, currentUserId: string, reportDetails: string, token: string|null) {
    try {
        const response = await axios.post(`${BASE_URL}/reportEvent`, {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedEventId: event.id
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log("reported event response: ", response);
    } catch (error) {
        console.error('Error:', error);
        alert('report failed');
    }
};

async function reportMessage(message: Message, currentUserId: string, reportDetails: string, token: string|null) {
    try {
        const response = await axios.post(`${BASE_URL}/reportMessage`, {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedMessageId: message.id
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(response);
    } catch (error) {
        console.error('Error:', error);
        alert('report failed');
    }
};

async function reportUser(user: User, currentUserId: string, reportDetails: string, token: string|null) {
    console.log(user);
    try {
        const response = await axios.post(`${BASE_URL}/reportUser`, {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedUserId: user.id
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(response);
    } catch (error) {
        console.error('Error:', error);
        alert('report failed');
    }
};
        
async function reportGroup(group: Group, currentUserId: string, reportDetails: string, token: string|null) {
    try {
        const response = await axios.post(`${BASE_URL}/reportGroup`, {
            details: reportDetails,
            reportedBy: currentUserId,
            reportedGroupId: group.id
        },{
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        console.log(response);
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
            reportEvent(input as Event, userDetails.email!, reportText, userDetails.token);
        }
        if(type === "message"){
            reportMessage(input as Message, userDetails.email!, reportText, userDetails.token);
        }
        if(type === "user"){
            reportUser(input as User, userDetails.email!, reportText, userDetails.token);
        }
        if(type === "group"){
            reportGroup(input as Group, userDetails.email!, reportText, userDetails.token);
        }
        onClose();
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
                gap={3}
            >
                <Typography>Please add more details of what you would like to report: </Typography>
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
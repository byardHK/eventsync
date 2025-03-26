import { Box, Button, CircularProgress, Dialog, Paper, styled, Typography } from "@mui/material";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "../components/Constants";
import User from "../types/User";
import Message from "../types/Message";
import { Group } from "./GroupsPage";
import EventInfo from "../types/EventInfo";
import { UserDetails, useUser } from "../sso/UserContext";
import BackButton from "../components/BackButton";
import { getCurDate } from "./ChatPage";

type Report = {
    id: number;
    details: string;
    reportedBy: string;
    reportedUserId: number;
    reportedMessageId: number;
    reportedEventInfoId: number;
    reportedGroupId: number;
    reportedTagId: number;
    reportedItemId: number;
    reportDate: string;
};

function AdminPage(){
    
    const [reports, setReports] = useState<Report[]>();
    const {userDetails} = useUser();

    async function reloadReports() {
        try {
          const response = await axios.get(`${BASE_URL}/get_reports/${userDetails.email}`, {
            headers: {
                'Authorization': `Bearer ${userDetails.token}`,
                'Content-Type': 'application/json'
            }
          });
          const res: Report[] = response.data;
          setReports(res);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

    useEffect(() => {
        reloadReports();
    }, []);

    return (userDetails.isAdmin ?
        <>
            <BackButton></BackButton>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
            >
                {reports ?
                    reports.map(report =>
                        <AdminReportCard report={report} key={report.id} reloadReports={reloadReports} userDetails={userDetails}/>
                    ) :
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Typography>Loading...</Typography>
                        <CircularProgress/>
                    </Box>
                }
            </Box>
        </> :
        <Typography>You don't have access to this page.</Typography>
    );
}

type AdminReportCardProps = {
    report: Report;
    userDetails: UserDetails;
    reloadReports: () => void;
};

function AdminReportCard({report, reloadReports, userDetails} : AdminReportCardProps){
    const [deleteReportModalOpen, setDeleteReportModalOpen] = useState<boolean>(false);
    const [viewReportModalOpen, setViewReportModalOpen] = useState<boolean>(false);
    const [warnUserModalOpen, setWarnUserModalOpen] = useState<boolean>(false);

    const ReportCard = styled(Paper)(({ theme }) => ({
        width: 300,
        height: 175,
        padding: theme.spacing(1),
        ...theme.typography.body2,
        textAlign: 'center',
      }));

      
    function DeleteReportModal(){
        return <Dialog
            onClose={()=> {setDeleteReportModalOpen(false)}}
            open={deleteReportModalOpen}
        >
            <Box sx={{padding : 3}}>
                <h2>Delete Report?</h2>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setDeleteReportModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={deleteReport}>Yes</Button>
                </Box>
            </Box>
        </Dialog>
    }

    async function deleteReport(){
        try {
            await axios.post(`${BASE_URL}/delete_report`, {
                reportId: report.id
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        reloadReports();
        setDeleteReportModalOpen(false);
    }

    function ViewReportModal(){
        return <Dialog
            onClose={()=> {
                setViewReportModalOpen(false);
                setWarnUserModalOpen(false);
            }}
            open={viewReportModalOpen || warnUserModalOpen}
        >
            <Box sx={{padding : 3}}>
                {report.reportedEventInfoId ? <ViewReportedEvent/>: <></> }
                {report.reportedUserId ? <ViewReportedUser/> : <></> }
                {report.reportedMessageId ? <ViewReportedMessage/> : <></>}
                {report.reportedGroupId ? <ViewReportedGroup/> : <></>}
            </Box>
        </Dialog>
    }

    async function warnUser(reportedUserId: string, warningMessage: string){
        try {
            await axios.post(`${BASE_URL}/warn_user`, {
                reportedUserId: reportedUserId,
                warningMessage: warningMessage,
                timeSent: getCurDate()
            }, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        reloadReports();
        setWarnUserModalOpen(false);
    }

    function ViewReportedMessage() {
        const [message, setMessage] = useState<Message>();

        async function loadMessage() {
            const res = await axios.get(`${BASE_URL}/get_message/${report.reportedMessageId}`);
            setMessage(res.data[0]);
        }

        useEffect(() => {
            loadMessage();
        }, []);

        if(!message) {
            return <CircularProgress/>
        }

        return ( viewReportModalOpen ?
            <Box>
                <Typography>{`Sender Email: ${message.senderId}`}</Typography>
                <Typography>{`Message: ${message.messageContent}`}</Typography>
            </Box> :
            <Box>
                <Typography>{`Warn the author of this message (${message.senderId})?`}</Typography>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={() => {warnUser(
                        message.senderId,
                        `A message you sent been reported by a user and reviewed by an admin:\n
                            (Message: ${message.messageContent})\n
                         The contents of message have warranted a warning. Subsequent reports may result in a ban from EventSync.
                        `
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    function ViewReportedUser() {
        const [user, setUser] = useState<User>();

        async function loadUser() {
            const res = await axios.get(`${BASE_URL}/api/get_user/${report.reportedUserId}`);
            setUser(res.data[0]);
        }

        useEffect(() => {
            loadUser();
        }, []);

        if(!user) {
            return <CircularProgress/>
        }

        return (viewReportModalOpen ?
            <Box>
                <Typography>{`Name: ${user.fname} ${user.lname}`}</Typography>
                <Typography>{`Email: ${user.id}`}</Typography>
            </Box> :
            <Box>
                <Typography>{`Warn ${user.fname} ${user.lname} (${user.id})?`}</Typography>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={() => {warnUser(
                        user.id,
                        `Your profile has been reported by a user and reviewed by an admin.\n
                         The contents of your profile have warranted a warning. Subsequent reports may result in a ban from EventSync.
                        `
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    function ViewReportedGroup() {
        const [group, setGroup] = useState<Group>();

        async function loadGroup() {
            const res = await axios.get(
                `${BASE_URL}/get_group/${report.reportedGroupId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            setGroup(res.data);
        }

        useEffect(() => {
            loadGroup();
        }, []);

        if(!group) {
            return <CircularProgress/>
        }

        return (viewReportModalOpen ?
            <Box>
                <Typography>{`Creator Email: ${group.creatorId}`}</Typography>
                <Typography>{`Group Name: ${group.groupName}`}</Typography>
            </Box> :
            <Box>
                <Typography>{`Warn the creator of this group (${group.creatorId})?`}</Typography>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={() => {warnUser(
                        group.creatorId,
                        `A group created by you has been reported by a user and reviewed by an admin:\n
                            (Group Name: ${group.groupName})\n
                        The contents of this group's details have warranted a warning. Subsequent reports may result in a ban from EventSync.
                        `
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    function ViewReportedEvent() {
        const [eventInfo, setEventInfo] = useState<EventInfo>();

        async function loadEvent() {
            const res = await axios.get(`${BASE_URL}/get_event_info/${report.reportedEventInfoId}/`);
            setEventInfo(res.data[0]);
        }

        useEffect(() => {
            loadEvent();
        }, []);

        if(!eventInfo) {
            return <CircularProgress/>
        }

        return (viewReportModalOpen ?
            <Box>
                <Typography>{`Creator: ${eventInfo.creatorName} (${eventInfo.creatorId})`}</Typography>
                <Typography>{`Event Title: ${eventInfo.title}`}</Typography>
                <Typography>{`Event Description: ${eventInfo.description}`}</Typography>
                <Typography>{`Event Location: ${eventInfo.locationName} ${eventInfo.locationLink ? `(${eventInfo.locationLink})` : ``}`}</Typography>
                {eventInfo.venmo ? <Typography>{`Venmo: ${eventInfo.venmo}`}</Typography> : <></>}
            </Box> :
            <Box>
                <Typography>{`Warn the creator of this event (${eventInfo.creatorId})?`}</Typography>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={() => {warnUser(
                        eventInfo.creatorId,
                        `An event created by you has been reported by a user and reviewed by an admin:\n
                            (Event Title: ${eventInfo.title}, \n
                            Event Description: ${eventInfo.description}, \n
                            Event Location: ${eventInfo.locationName} ${eventInfo.locationLink ? `(${eventInfo.locationLink})` : ``}, \n
                            Venmo: ${eventInfo.venmo})\n
                         The contents of this event's details have warranted a warning. Subsequent reports may result in a ban from EventSync.
                        `
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    return <Box>
        <DeleteReportModal></DeleteReportModal>
        <ViewReportModal></ViewReportModal>
        <ReportCard elevation={10} square={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '200px'}}>
            <h1>{ReportType(report)} Report</h1>
            <p>{report.details}</p>
            <Box display="flex" flexDirection="row" gap={2} >
                <Button variant="contained" onClick={() => { setViewReportModalOpen(true) }}>
                    <RemoveRedEyeIcon/>
                </Button>
                <Button variant="contained" onClick={() => { setDeleteReportModalOpen(true) }}>
                    <DeleteIcon/>
                </Button>
                <Button variant="contained" onClick={() => { setWarnUserModalOpen(true) }}>
                    <WarningIcon/>
                </Button>
                {/* <Button variant="contained">
                    <BlockIcon/>
                </Button> */}
            </Box>
        </ReportCard>
    </Box>
}

function ReportType(report: Report){
    if(report.reportedEventInfoId != null){
        return "Event";
    }else if(report.reportedGroupId != null){
        return "Group";
    }else if(report.reportedItemId != null){
        return "Item";
    }else if(report.reportedMessageId != null){
        return "Message";
    }else if(report.reportedTagId != null){
        return "Tag";
    }else if(report.reportedUserId != null){
        return "User";
    }else{
        "Broken"
    }
}

export default AdminPage
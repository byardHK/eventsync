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
import BlockIcon from '@mui/icons-material/Block';

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

function AdminPage() {
  const { userDetails } = useUser(); // Fetch user details from context
  const [reports, setReports] = useState<Report[] | null>(null);
  const [loading, setLoading] = useState(true); // Track loading state for reports

  const reloadReports = async () => {
    if (!userDetails.email || !userDetails.token) return;

    try {
      const response = await axios.get(`${BASE_URL}/get_reports/${userDetails.email}`, {
        headers: {
          'Authorization': `Bearer ${userDetails.token}`,
          'Content-Type': 'application/json',
        },
      });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    reloadReports();
  }, [userDetails.email, userDetails.token]); 

  if (loading) {
    return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingTop={9}>
        <Typography color="white">Loading reports...</Typography>;
    </Box>)
  }

  if (!userDetails || !userDetails.isAdmin) {
    return <Typography color="white">You don't have access to this page.</Typography>;
  }

  return (
    <>
      <Box display="flex" flexDirection="row" gap={8} paddingTop={2} paddingBottom={1} sx={{ position: 'fixed', top: '0', backgroundColor: "#1c284c", width: "100%", right: 0, left: 0, marginRight: "0", marginLeft: "auto", "z-index": 10 }}>
        <BackButton />
        <Typography variant="h4" fontWeight="bold" color="white">Reports</Typography>
      </Box>

      <Box display="flex" flexDirection="column" alignItems="center" gap={2} paddingTop={9}>
        {reports && reports.length > 0 ? (
          reports.map((report) => (
            <AdminReportCard key={report.id} report={report} reloadReports={() => reloadReports()} userDetails={userDetails} />
          ))
        ) : (
          <Typography color="white">No reports available.</Typography>
        )}
      </Box>
    </>
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
    const [banUserModalOpen, setBanUserModalOpen] = useState<boolean>(false);

    const ReportCard = styled(Paper)(({ theme }) => ({
        width: 300,
        height: 175,
        padding: theme.spacing(1),
        ...theme.typography.body2,
        textAlign: 'center',
      }));

    function BanUserModal(){
        return <Dialog
            onClose={()=> {setBanUserModalOpen(false)}}
            open={banUserModalOpen}
        >
            <Box sx={{padding : 3}}>
                {report.reportedEventInfoId ? <BanEventCreator/>: <></> }
                {report.reportedUserId ? <BanUser/> : <></> }
                {report.reportedMessageId ? <BanMessageSender/> : <></>}
                {report.reportedGroupId ? <BanGroupCreator/> : <></>}
            </Box>
        </Dialog>
    }

    async function banUser(userId: string) {
        try {
            await axios.post(`${BASE_URL}/ban_user`, {
                userId: userId
            }, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (error) {
            console.error('Error banning user:', error);
        }
        reloadReports();
        setBanUserModalOpen(false);
    }
    
      
    function DeleteReportModal(){
        return <Dialog
            onClose={()=> {setDeleteReportModalOpen(false)}}
            open={deleteReportModalOpen}
        >
            <Box sx={{padding : 5}} width={200} height={100}>
                <Typography align="center" variant="h5">Delete Report?</Typography>
                <Box display="flex" flexDirection="row" width="100%" gap={2} paddingTop={5}>
                    <Button variant="contained" sx={{backgroundColor: "#1c284c", color:"white"}} fullWidth onClick={()=> {setDeleteReportModalOpen(false)}}>Cancel</Button>
                    <Button variant="contained" sx={{backgroundColor: "#1c284c", color:"white"}} fullWidth onClick={deleteReport}>Yes</Button>
                </Box>
            </Box>
        </Dialog>
    }

    async function deleteReport(){
        try {
            await axios.post(`${BASE_URL}/delete_report`, {
                reportId: report.id
            },
            {headers: {
                'Authorization': `Bearer ${userDetails?.token}`,
                'Content-Type': 'application/json',
            }});
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
            <Box display="flex" justifyContent="center">
                {viewReportModalOpen ? <Button variant="contained" sx={{backgroundColor: "#1c284c", width: "75%", marginBottom:2}} onClick={() => {setViewReportModalOpen(false)}}>Close</Button>
                :
                <></>}
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

    function BanMessageSender(){
        const [message, setMessage] = useState<Message>();

        async function loadMessage() {
            const res = await axios.get(`${BASE_URL}/get_message/${report.reportedMessageId}`,
                {headers: {
                'Authorization': `Bearer ${userDetails?.token}`,
                'Content-Type': 'application/json',
                }}
            );
            setMessage(res.data[0]);
        }

        useEffect(() => {
            loadMessage();
        }, []);

        if(!message) {
            return <CircularProgress/>
        }

        return ( 
            <Box>
                <Typography>{`Ban the author of this message (${message.senderId})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setBanUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {banUser(
                        message.senderId
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    function BanUser(){
        const [user, setUser] = useState<User>();

        async function loadUser() {
            const res = await axios.get(`${BASE_URL}/api/get_user/${report.reportedUserId}`, 
                {headers: {
                    'Authorization': `Bearer ${userDetails?.token}`,
                    'Content-Type': 'application/json',
                }}
            );
            setUser(res.data[0]);
        }

        useEffect(() => {
            loadUser();
        }, []);

        if(!user) {
            return <CircularProgress/>
        }

        return (
            <Box>
                <Typography>{`Ban ${user.fname} ${user.lname} (${user.id})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {banUser(
                        user.id
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    function BanGroupCreator() {
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

        return (
            <Box>
                <Typography>{`Ban the creator of this group (${group.creatorId})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setBanUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {banUser(
                        group.creatorId
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }

    function BanEventCreator() {
        const [eventInfo, setEventInfo] = useState<EventInfo>();

        async function loadEvent() {
            const res = await axios.get(`${BASE_URL}/get_event_info/${report.reportedEventInfoId}/`,
                {headers: {
                    'Authorization': `Bearer ${userDetails?.token}`,
                    'Content-Type': 'application/json',
                }}
            );
            setEventInfo(res.data[0]);
        }

        useEffect(() => {
            loadEvent();
        }, []);

        if(!eventInfo) {
            return <CircularProgress/>
        }

        return (
            <Box>
                <Typography>{`Ban the creator of this event (${eventInfo.creatorId})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setBanUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {banUser(
                        eventInfo.creatorId
                    )}}>Yes</Button>
                </Box>
            </Box>
        );
    }


    function ViewReportedMessage() {
        const [message, setMessage] = useState<Message>();
        const [imageURL, setImageURL] = useState<string>();
        const [reportCount, setReportCount] = useState<number | undefined>();

        async function loadMessage() {
            try {
                // Fetch the message with the headers correctly passed as the second argument
                const msg: Message = (await axios.get(`${BASE_URL}/get_message/${report.reportedMessageId}`, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                })).data[0];
                
                const sender = msg.senderId
                if (!sender){
                    return;
                }
                // Fetch the user using msg.data[0].senderId (or adjust if msg.data is structured differently)
                const user: User = await axios.get(`${BASE_URL}/api/get_user/${sender}`, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                });
        
                // Set the state with the retrieved message and user report count
                setMessage(msg);
                setReportCount(user.numTimesReported);
            } catch (error) {
                console.error("Error loading message or user:", error);
            }
        }
        

        async function loadImage(id: number) {
            try {
                const response = await axios.get<string>(`${BASE_URL}/get_image/${id}/`,  {
                    responseType: 'blob',
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'                       
                    }
                });
                const blob = new Blob([response.data], { type: 'image/jpeg' });
                setImageURL(URL.createObjectURL(blob));
            }catch (error) {
                console.error('Error retrieving image:', error);
            }
        }

        useEffect(() => {
            loadMessage();

            return () => {
                if (imageURL) {
                  URL.revokeObjectURL(imageURL);
                }
              };
        }, []);

        if(!message) {
            return <CircularProgress/>
        }

        return ( viewReportModalOpen ?
            <Box display="flex" flexDirection="column" gap={3} height={300} width={200} padding={3}>
                {message.messageContent && <Typography variant="h6" fontWeight="bold">{`${message.messageContent}`}</Typography>}
                <Typography>{`Sent by: ${message.senderId}${ reportCount && reportCount >= 2 ? ` (reported ${reportCount-1} other times)` : ``}` }</Typography>
                {message.imagePath && <div>
                    {imageURL ?
                <Box
                    component="img"
                    sx={{
                    maxHeight: '100%',
                    maxWidth: '100%',
                    }}
                    alt="Image in chat"
                    src={imageURL}
                />   : 
                <Typography>Loading image</Typography>}
                </div>}
            </Box> :
            <Box>
                <Typography>{`Warn the author of this message (${message.senderId})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {warnUser(
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
        const [reportCount, setReportCount] = useState<number | undefined>(); 

        async function loadUser() {
            const userRes = (await axios.get(`${BASE_URL}/api/get_user/${report.reportedUserId}`,
                {headers: {
                    'Authorization': `Bearer ${userDetails?.token}`,
                    'Content-Type': 'application/json',
                }}
            )).data[0];
            const user : User = (await axios.get(`${BASE_URL}/api/get_user/${userRes.id}`,
                {headers: {
                    'Authorization': `Bearer ${userDetails?.token}`,
                    'Content-Type': 'application/json',
                }}
            )).data[0];
            setUser(userRes);
            setReportCount(user.numTimesReported)
        }

        useEffect(() => {
            loadUser();
        }, []);

        if(!user) {
            return <CircularProgress/>
        }

        return (viewReportModalOpen ?
            <Box display="flex" flexDirection="column" gap={3} height={300} width={200} padding={3}>
                <Typography variant="h6" fontWeight="bold">{`${user.fname} ${user.lname}`}</Typography>
                <Typography>{`User Email: ${user.id}${ reportCount && reportCount >= 2 ? ` (reported ${reportCount-1} other times)` : ``}`}</Typography>
            </Box> :
            <Box>
                <Typography>{`Warn ${user.fname} ${user.lname} (${user.id})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {warnUser(
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
        const [reportCount, setReportCount] = useState<number | undefined>(); 

        async function loadGroup() {
            if(!report.reportedGroupId){
                return;
            }
            const group = (await axios.get(
                `${BASE_URL}/get_group/${report.reportedGroupId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )).data;
            const user : User = (await axios.get(`${BASE_URL}/api/get_user/${group.creatorId}`, 
                {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )).data[0];
            setGroup(group);

            setReportCount(user.numTimesReported);
        }

        useEffect(() => {
            loadGroup();
        }, []);

        if(!group) {
            return <CircularProgress/>
        }

        return (viewReportModalOpen ?
            <Box display="flex" flexDirection="column" gap={3} height={300} width={200} padding={3}>
                <Typography variant="h6" fontWeight="bold">{`${group.groupName}`}</Typography>
                <Typography>{`Created by: ${group.creatorId}${ reportCount && reportCount >= 2 ? ` (reported ${reportCount-1} other times)` : ``}`}</Typography>
            </Box> :
            <Box>
                <Typography>{`Warn the creator of this group (${group.creatorId})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {warnUser(
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
        const [reportCount, setReportCount] = useState<number | undefined>(); 

        async function loadEvent() {
            const event = (await axios.get(`${BASE_URL}/get_event_info/${report.reportedEventInfoId}/`,
                {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )).data[0];
            const user : User = (await axios.get(`${BASE_URL}/api/get_user/${event.creatorId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )).data[0];
            setEventInfo(event);
            setReportCount(user.numTimesReported);
        }

        useEffect(() => {
            loadEvent();
        }, []);

        if(!eventInfo) {
            return <CircularProgress/>
        }

        return (viewReportModalOpen ?
            <Box display="flex" flexDirection="column" gap={3} height={300} width={200} padding={3}>
                <Typography variant="h6" fontWeight="bold">{`${eventInfo.title}`}</Typography>
                <Typography>{`Created by: ${eventInfo.creatorName} (${eventInfo.creatorId})${ reportCount && reportCount >= 2 ? ` (reported ${reportCount-1} other times)` : ``}`}</Typography>
                <Typography>{`Event Description: ${eventInfo.description}`}</Typography>
                <Typography>{`Event Location: ${eventInfo.locationName} ${eventInfo.locationLink ? `(${eventInfo.locationLink})` : ``}`}</Typography>
                {eventInfo.venmo ? <Typography>{`Venmo: ${eventInfo.venmo}`}</Typography> : <></>}
            </Box> :
            <Box>
                {/* TODO: creatorId = AI study session */}
                <Typography>{`Warn the creator of this event (${eventInfo.creatorId})?`}</Typography>
                <Box display="flex" flexDirection="row" gap={2} paddingTop={5}>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={()=> {setWarnUserModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto", backgroundColor: "#1c284c", color: "white"}} onClick={() => {warnUser(
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
        <BanUserModal></BanUserModal>
        <ReportCard elevation={10} square={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '250px', width: "325px"}}>
            <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" gap={3}>
                <Typography variant="h4" fontWeight="bold" >{ReportType(report)}</Typography>
                <Typography>{report.details}</Typography>
                <Box display="flex" flexDirection="row" gap={2} padding={2}>
                    <Button sx={{backgroundColor: "#1c284c"}} variant="contained" onClick={() => { setViewReportModalOpen(true) }}>
                        <RemoveRedEyeIcon/>
                    </Button>
                    <Button sx={{backgroundColor: "#1c284c"}} variant="contained" onClick={() => { setDeleteReportModalOpen(true) }}>
                        <DeleteIcon/>
                    </Button>
                    <Button sx={{backgroundColor: "#1c284c"}} variant="contained" onClick={() => { setWarnUserModalOpen(true) }}>
                        <WarningIcon/>
                    </Button>
                    <Button sx={{backgroundColor: "#1c284c"}} variant="contained" onClick={() => { setBanUserModalOpen(true) }}>
                        <BlockIcon/>
                    </Button>
                </Box>
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
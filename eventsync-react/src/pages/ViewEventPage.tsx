import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Dialog, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useUser } from '../sso/UserContext';
import "../styles/style.css";
import { timeToString2Time, timeToString2Date } from '../StyledCard';
import dayjs from 'dayjs';
import Tag from '../types/Tag';
import FlagIcon from '@mui/icons-material/Flag';
import ReportModal from '../components/ReportModal';
import { BASE_URL } from '../components/Constants';
import { useNavigate } from "react-router-dom";
import BackButton from '../components/BackButton';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';


function ViewEventPage() {
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    const { eventId } = useParams<{ eventId: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [expanded, setExpanded] = useState<string | false>(false);
    const intEventId = parseInt(eventId || '-1');
    const [open, setOpen] = useState(false);
    console.log(open);
    const [isRsvped, setIsRsvped] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    console.log(handleClose);

    const navigate = useNavigate();
  
    const handleRsvp = async () => {
    try {
        const rsvpInfo = {
            userId: currentUserId,
            eventId: intEventId
        }
        const response = await axios.post(`${BASE_URL}/rsvp`, rsvpInfo,{
          headers: {
            'Authorization': `Bearer ${userDetails.token}`,
            'Content-Type': 'application/json',
            }
        });
        console.log("removing unused  error: ", response);
        setIsRsvped(true);
        handleOpen();
    } catch (error) {
        console.error('Error:', error);
        if (axios.isAxiosError(error) && error.response && error.response.data.message === "RSVP limit reached") {
            alert('RSVP limit reached');
        } else {
            alert('RSVP failed');
        }
    }
};

    const handleUnrsvp = async () => {
        const unrsvpInfo = {
            userId: currentUserId,
            eventId: intEventId
        }
        try {
            const response = await axios.post(`${BASE_URL}/unrsvp`,unrsvpInfo,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                }
            });
            console.log("removing unused  error: ", response);
            setIsRsvped(false);
        } catch (error) {
            console.error('Error:', error);
            alert('Un-RSVP failed');
        }
    };

    useEffect(() => {
        const checkRsvpStatus = async () => {
            if (!userDetails || !userDetails.email) {
                console.error('User details are missing');
                return; 
            }
            try {
                const response = await axios.post(`${BASE_URL}/check_rsvp`, {
                    userId: currentUserId,
                    eventId: intEventId
                }, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                });
                setIsRsvped(response.data.rsvp);
            } catch (error) {
                console.error('Error:', error);
            }
        };

        checkRsvpStatus();
    }, [currentUserId, intEventId]);

    function RsvpModal() {
        return (
            <>
                <Button variant="contained" onClick={isRsvped ? handleUnrsvp : handleRsvp} sx={{ width: "100px", height: "60px",backgroundColor: "#71A9F7", color: "black" }}>
                    {isRsvped ? 'Un-RSVP' : 'RSVP'}
                </Button>
        </>
        )
    }
    
    function RsvpListModal({ eventId }: { eventId: number }) {
        const [openRsvpList, setOpenRsvpList] = useState(false);
        const [rsvpList, setRsvpList] = useState<Rsvp[] | undefined>();
    
        const handleOpenRsvpList = () => {
            setOpenRsvpList(true);
            fetchRsvpList();
        };
    
        const handleCloseRsvpList = () => setOpenRsvpList(false);
    
        const fetchRsvpList = async () => {
            try {
                const response = await axios.post(`${BASE_URL}/get_rsvps`, {
                    eventId: eventId
                }, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                });
                setRsvpList(response.data);
            } catch (error) {
                console.error('Error fetching RSVP list:', error);
            }
        };

        return (
            <>
                <Button variant="contained" onClick={handleOpenRsvpList} sx={{ width: "140px", height: "60px", backgroundColor: "#71A9F7", color: "black" }}>View RSVP List</Button>
                <Dialog onClose={handleCloseRsvpList} open={openRsvpList}>
                    <Typography variant="h5" fontWeight="bold" align="center">RSVP List</Typography>
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                justifyContent="center"
                                sx={{ width: "100%" }}
                                minWidth={300}
                                minHeight={300}
                                paddingTop={3}
                                paddingBottom={2}
                            >
                                { rsvpList ?
                                    (rsvpList.length === 0 ? 
                                        <Typography>No one attending event</Typography> :
                                        rsvpList.map(user => (
                                            <Card
                                                key={user.id}
                                                sx={{
                                                    width: "200px", 
                                                    padding: "10px", 
                                                    backgroundColor: "#71A9F7", 
                                                    display: "flex", 
                                                    justifyContent: "space-between", 
                                                    alignItems: "center", 
                                                    margin: "5px 0"
                                                }}
                                                square={false}
                                                onClick={() => {navigate(`/profile/${user.id}`)}}
                                            >
                                                <Box flexGrow={1} textAlign="left" marginLeft={5}>
                                                    {`${user.fname} ${user.lname}`}
                                                </Box>
                                            </Card>
                                        ))
                                    ) :
                                    <Typography>Loading RSVPs...</Typography>
                                }
                            </Box>
                        <Box  display="flex" justifyContent="center" paddingBottom="10px">
                            <Button variant="contained" sx={{backgroundColor: "#1c284c", width: "75%"}} onClick={handleCloseRsvpList}>Close</Button>
                        </Box>
                </Dialog>
        </>
    );
}

    useEffect(() => {
        const fetchEvent = async () => {
            if (!currentUserId) {
                console.error('User ID is missing');
                return;  
            }
            try {
                const response = await axios.get(`${BASE_URL}/get_event/${intEventId}/${currentUserId}`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                });
                setEvent(response.data);
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        }
        fetchEvent();
    }, [eventId, isRsvped, userDetails]);

    const handleChange = (panel: string) => (_SyntheticEvent: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    async function navigateToChat() {
        try {
            if (event) {
                const response = await axios.get(`${BASE_URL}/get_event_chat_id/${event.id}/`, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (Array.isArray(response.data) && response.data.length > 0) {
                    navigate(`/viewChat/${response.data[0].chatId}`);
                } else {
                    console.error('No chat ID found for the event.');
                    alert('No chat is associated with this event.');
                }
            }
        } catch (error) {
            console.error('Error navigating to event chat:', error);
            alert('Failed to navigate to the event chat.');
        }
    }

    return (
        <>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
            >
                <Box
                    display="flex"
                    justifyContent="flex-start"
                    width="100%"
                    padding={2}
                    sx={{ position: 'fixed', top: 0, backgroundColor: "#1c284c", zIndex: 10 }}
                >
                    <BackButton />
                </Box>

                {event ? ( 
                    <GetEvent
                        event={event}
                        initialItems={event.items}
                        expanded={expanded}
                        handleChange={handleChange}
                        isRsvped={isRsvped}
                    />
                ) : (
                    <Typography color="white">Loading Event...</Typography>
                )}
                <Box
                    display="flex"
                    flexDirection="row"
                    width="100%"
                    paddingBottom={2}
                    paddingTop={2}
                    sx={{ backgroundColor: "#1c284c" }}
                    justifyContent="space-around"
                    style={{ position: 'fixed', bottom: '0' }}
                >
                    <RsvpModal />
                    <RsvpListModal eventId={intEventId} />
                    <Button
                        disabled={!isRsvped}
                        variant="contained"
                        onClick={navigateToChat}
                        sx={{ width: "100px", height: "60px", backgroundColor: "#71A9F7", color: "black" }}
                    >
                        Event Chat
                    </Button>
                </Box>
            </Box>
        </>
    );
};

function GetEvent({ event, initialItems, expanded, handleChange, isRsvped}: { event: Event, initialItems: Item[], expanded: string | false, handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void, isRsvped: Boolean}) {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [itemSignUpChanged, setItemSignUpChanged] = useState<Boolean[]>(new Array(items.length).fill(false));
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
  
    useEffect(() => {
        setItems(initialItems)
        setItemSignUpChanged(new Array(items.length).fill(false))
    }, [userDetails, event]);

    function ListTags(){
        return <>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
                gap={1}
            >
                {event.tags.map((tag, index) =>
                <Box 
                    key={index}
                >    
                    <Chip label={tag.name} sx={{backgroundColor:'#71A9F7', color: "black" }}></Chip>
                </Box>
            )}
            </Box>
        </>
    }

    function changeItemQuantity(amount: number, index: number){
        const newItems = [...items];
        newItems[index].myQuantitySignedUpFor += amount;
        if(newItems[index].myQuantitySignedUpFor < 0){
            newItems[index].myQuantitySignedUpFor = 0;
        } else if (newItems[index].myQuantitySignedUpFor + newItems[index].othersQuantitySignedUpFor > items[index].amountNeeded){
            newItems[index].myQuantitySignedUpFor = items[index].amountNeeded - newItems[index].othersQuantitySignedUpFor;
        }
        setItems(newItems);
        var newItemsSignedUpFor = [...itemSignUpChanged];
        newItemsSignedUpFor[index] = true;
        setItemSignUpChanged(newItemsSignedUpFor);
    }

    async function postItemSignedUpFor(item: Item, index: number){
        try {
            const postPath = `${BASE_URL}/edit_user_to_item/`;
            const data = {
                'userId': currentUserId,
                'eventId': event.id,
                'itemId': item.id,
                'quantity': item.myQuantitySignedUpFor
            }
            const response = await fetch(postPath, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            console.log('Data sent successfully:', response.json());
            var newItemsSignedUpFor = [...itemSignUpChanged];
            newItemsSignedUpFor[index] = false;
            setItemSignUpChanged(newItemsSignedUpFor);
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    }

    const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);

    return (
        <>
            <ReportModal input={event} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="event"/>
            <Box display="flex" justifyContent="space-between" flexDirection="row" sx={{width: "100%", position: 'fixed', paddingTop: 2, top: '0px', backgroundColor: "#1c284c",  "z-index": 10}}>
                <BackButton></BackButton>
                <Typography align="center" color="white" fontWeight="bold" sx={{wordBreak: "break-word"}} variant="h4">{event.title}</Typography>
                <IconButton onClick={()=>setReportModalOpen(true)}>
                    <FlagIcon style={{ color: '#ad1f39'}}></FlagIcon>
                </IconButton>
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width="100%"
                paddingTop={17}
                paddingBottom={18}
            >
                <Accordion defaultExpanded disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                        aria-controls="panel1-content"
                        id="panel1-header"
                    >
                        <Typography sx={{color: "white"}} variant="h4" component="span">Summary</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box display="flex" flexDirection="row" gap={1}>
                            <AccessAlarmIcon style={{color:"white"}}></AccessAlarmIcon>
                            <Typography sx={{color: "white"}}>{timeToString2Date(dayjs(event.startTime), dayjs(event.endTime))}</Typography>
                            <Typography sx={{color: "white"}}>{timeToString2Time(dayjs(event.startTime), dayjs(event.endTime))}</Typography>
                        </Box>
                        <br></br>
                        <Box display="flex" flexDirection="row" gap={1}>
                            <LocationOnIcon style={{color:"white"}}></LocationOnIcon>
                            <Typography sx={{color: "white", wordBreak: "break-word"}}>{event.locationName}</Typography>
                        </Box>
                        <br></br>
                        {event.creatorName ?
                            <Typography sx={{color: "white"}}>{"Created By: "}<Link style={{color:"#71A9F7"}} to={`/profile/${event.creatorId}`}>{event.creatorName}</Link></Typography>
                            :
                            <></>
                        }
                        <br></br>
                        <ListTags></ListTags>
                    </AccordionDetails>
                </Accordion>
                {event.description ?
                    <Accordion disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                            aria-controls="panel2-content"
                            id="panel2-header"
                        >
                            <Typography sx={{color: "white"}} variant="h4" component="span">Description</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{minHeight:"100px"}}>
                            <Typography sx={{color: "white", wordBreak: "break-word" }}>{event.description}</Typography>
                        </AccordionDetails>
                    </Accordion>
                    :
                    <></>
                    }
                {items && items.length > 0 ?
                    <Accordion disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}>
                                <Typography variant="h4" sx={{color: "white"}}>Items to Bring</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                    {items.map((item, index) => (
                                        <Typography sx={{color: "white"}} key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                                        <div >{`${item.name}: ${item.othersQuantitySignedUpFor + item.myQuantitySignedUpFor}/${item.amountNeeded}`}</div>
                                        {isRsvped && (
                                        <div style={{display: 'flex', flexDirection: 'row' }}>
                                            <Button sx={{ m: 1 }} style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="contained" onClick={() => changeItemQuantity(-1, index)}>
                                                <RemoveIcon style={{ fontSize: 15 }}></RemoveIcon>
                                            </Button>
                                            <Box display="flex" alignItems="center">
                                            {item.myQuantitySignedUpFor}
                                            </Box>
                                            <Button sx={{ m: 1 }} style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="contained" onClick={() => changeItemQuantity(1, index)}>
                                                <AddIcon style={{ fontSize: 15 }}></AddIcon> 
                                            </Button>
                                            <Button style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="text"
                                                onClick={() => postItemSignedUpFor(item, index)}
                                                sx={{
                                                    m: 1,
                                                    "&.Mui-disabled": {
                                                      color: "#c0c0c0"
                                                    }
                                                  }}
                                                disabled={!itemSignUpChanged[index]}>
                                                <CheckCircleOutlineRoundedIcon style={{ fontSize: 30 }}></CheckCircleOutlineRoundedIcon>
                                            </Button>
                                        </div>
                                    )}
                                    </Typography>))
                                }
                            </AccordionDetails>
                        </Accordion> :
                        <></>
                    }
                    {event.venmo ?
                    <Accordion disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                        aria-controls="panel2-content"
                        id="panel2-header"
                    >
                        <Typography sx={{color: "white"}} variant="h4" component="span">Payment</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography sx={{color: "white"}}>{event.venmo}</Typography>
                    </AccordionDetails>
                </Accordion>
                :
                <></>
                }
            </Box>
        </>
    );
}

export type Event = {
    eventName: string;
    startTime: string;
    endTime: string;
    id: number;
    creatorId: number;
    groupId: number;
    title: string;
    description: string;
    locationName: string;
    locationLink: string;
    RSVPLimit: number;
    isPublic: boolean;
    isWeatherDependant: boolean;
    numTimesReported: number;
    eventInfoCreated: string;
    tags: Tag[];
    files: String[];
    items: Item[];
    venmo: string;
    creatorName: string;
};

interface Rsvp {
    id: string;
    fname: string;
    lname: string;
};

export type Item = {
    name: string;
    amountNeeded: number;
    othersQuantitySignedUpFor: number;
    myQuantitySignedUpFor: number;
    id: number;
}

export default ViewEventPage;
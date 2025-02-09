import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { timeToString2 } from '../StyledCard';
import dayjs from 'dayjs';
import Tag from '../types/Tag';
import FlagIcon from '@mui/icons-material/Flag';
import ReportModal from '../components/ReportModal';
import EventSyncEvent from '../types/EventSyncEvent';


function ViewEventPage() {
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    const { eventId } = useParams<{ eventId: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [expanded, setExpanded] = useState<string | false>(false);
    const intEventId = parseInt(eventId || '-1');
    const [open, setOpen] = useState(false);
    const [isRsvped, setIsRsvped] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
  
    const handleRsvp = async () => {
        try {
            await axios.post('http://localhost:5000/rsvp', {
                userId: currentUserId,
                eventId: intEventId
            });
            setIsRsvped(true);
            handleOpen();
        } catch (error) {
            console.error('Error:', error);
            alert('RSVP failed');
        }
    };

    const handleUnrsvp = async () => {
        try {
            const response = await axios.post('http://localhost:5000/unrsvp', {
                userId: currentUserId,
                eventId: intEventId
            });
            setIsRsvped(false);
        } catch (error) {
            console.error('Error:', error);
            alert('Un-RSVP failed');
        }
    };

    useEffect(() => {
        const checkRsvpStatus = async () => {
            try {
                const response = await axios.post('http://localhost:5000/check_rsvp', {
                    userId: currentUserId,
                    eventId: intEventId
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
                <Button variant="outlined" onClick={isRsvped ? handleUnrsvp : handleRsvp}>
                    {isRsvped ? 'Un-RSVP' : 'RSVP'}
                </Button>
                {/* <Dialog onClose={handleClose} open={open}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ width: "100%" }}
                        minWidth={300}
                    >
                        <Button variant="outlined" fullWidth onClick={handleClose}>No</Button>
                        <Button variant="outlined" fullWidth onClick={handleClose}>Yes</Button>
                    </Box> 
                    <Button variant="outlined" fullWidth onClick={handleClose}>Close</Button>
                </Dialog> */}
        </>
        )
    }
    
    function RsvpListModal({ eventId }: { eventId: number }) {
        const [openRsvpList, setOpenRsvpList] = useState(false);
        const [rsvpList, setRsvpList] = useState<Rsvp[]>([]);
    
        const handleOpenRsvpList = () => {
            setOpenRsvpList(true);
            fetchRsvpList();
        };
    
        const handleCloseRsvpList = () => setOpenRsvpList(false);
    
        const fetchRsvpList = async () => {
            try {
                const response = await axios.post('http://localhost:5000/get_rsvps', {
                    eventId: eventId
                });
                setRsvpList(response.data);
            } catch (error) {
                console.error('Error fetching RSVP list:', error);
            }
        };
    
        return (
            <>
                <Button variant="outlined" onClick={handleOpenRsvpList}>View RSVP List</Button>
                <Dialog onClose={handleCloseRsvpList} open={openRsvpList}>
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        sx={{ width: "100%" }}
                        minWidth={300}
                    >
                    <h2>RSVP List</h2>
                    <ul>
                        {rsvpList.map(user => (
                            <li key={user.userId}>{user.fname} {user.lname}</li>
                        ))}
                    </ul>
                    <Button variant="outlined" fullWidth onClick={handleCloseRsvpList}>Close</Button>
                </Box>
            </Dialog>
        </>
    );
}

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/get_event/${intEventId}/${currentUserId}`);
                setEvent(response.data);
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        }
        fetchEvent();
    }, [eventId, isRsvped]);

    const handleChange = (panel: string) => (SyntheticEvent: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    return <>
        <Box
            display="flex"
            alignItems="right" 
            justifyContent="right"
            padding={2}
        >
            <Button variant="contained">
                <PersonIcon/>
            </Button>
        </Box>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            {event ? (
                <GetEvent event={event} initialItems={event.items} expanded={expanded} handleChange={handleChange} isRsvped={isRsvped}/>
            ) : (
                <p>Loading Event {eventId}</p>
            )}
            <Box
            display="flex"
            flexDirection="row"
            alignItems="center" 
            justifyContent="center"
            >
                <RsvpModal/>     
                <RsvpListModal eventId={intEventId}/>       
            </Box>
            <BottomNavBar/>
        </Box>
    </>;
};

function GetEvent({ event, initialItems, expanded, handleChange, isRsvped}: { event: Event, initialItems: Item[], expanded: string | false, handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void, isRsvped: Boolean}) {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [itemSignUpChanged, setItemSignUpChanged] = useState<Boolean[]>(new Array(items.length).fill(false));
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
  
    useEffect(() => {
        setItems(initialItems)
        setItemSignUpChanged(new Array(items.length).fill(false))
    }, [event]);

    function ListTags(){
        return <>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
            >
                {event.tags.map((tag, index) =>
                <Box 
                    key={index}
                >    
                    <Chip label={tag.name}></Chip>
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
            const postPath = `http://localhost:5000/edit_user_to_item/`;
            const data = {
                'userId': currentUserId,
                'eventId': event.id,
                'itemId': item.id,
                'quantity': item.myQuantitySignedUpFor
            }
            const response = await fetch(postPath, {
                method: 'PUT',
                headers: {
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
        <Card variant="outlined">
            <ReportModal input={event} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="event"/>
            <Box display="flex" alignItems="right" justifyContent="right">
                <IconButton onClick={()=>setReportModalOpen(true)}>
                    <FlagIcon style={{ color: 'red'}}></FlagIcon>
                </IconButton>
            </Box>
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={250} minWidth={250} gap={1} padding={2}>
                <p>{event.title}</p>
                <p>{timeToString2(dayjs(event.startTime), dayjs(event.endTime))}</p>
                <p>{`Where?: ${event.locationName}`}</p>
                <p>{`Created By: ${event.creatorName}`}</p>
                <ListTags></ListTags>
            </Box>
            <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Description</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Typography>{event.description}</Typography>
                </AccordionDetails>
            </Accordion>
            {items && items.length > 0 && (
                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Items to Bring</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {items.map((item, index) => (
                            <Typography key={index} style={{ display: 'flex', flexDirection: 'row', alignItems: "center" }}>
                            <div style={{ width: '50%' }}>{`${item.name}: ${item.othersQuantitySignedUpFor + item.myQuantitySignedUpFor}/${item.amountNeeded}`}</div>
                            {isRsvped && (
                            <div style={{ width: '50%', display: 'flex', flexDirection: 'row' }}>
                                <Button sx={{ m: 1 }} style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="contained" onClick={() => changeItemQuantity(-1, index)}>
                                    <RemoveIcon style={{ fontSize: 15 }}></RemoveIcon>
                                </Button>
                                <Box display="flex" alignItems="center">
                                {item.myQuantitySignedUpFor}
                                </Box>
                                <Button sx={{ m: 1 }} style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="contained" onClick={() => changeItemQuantity(1, index)}>
                                    <AddIcon style={{ fontSize: 15 }}></AddIcon> 
                                </Button>
                                <Button sx={{ m: 1 }} style={{maxWidth: '30px', maxHeight: '30px', minWidth: '30px', minHeight: '30px'}} variant="text"
                                    onClick={() => postItemSignedUpFor(item, index)}
                                    disabled={!itemSignUpChanged[index]}>
                                    <CheckCircleOutlineRoundedIcon style={{ fontSize: 30 }}></CheckCircleOutlineRoundedIcon>
                                </Button>
                            </div>
                            )}
                            </Typography>))}
                    </AccordionDetails>
                </Accordion>
            )}
            {event.files && event.files.length > 0 && (
                <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Files</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>Files placeholder</Typography>
                    </AccordionDetails>
                </Accordion>
            )}
            {event.venmo && (
                <Accordion expanded={expanded === 'panel4'} onChange={handleChange('panel4')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Payments</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>{event.venmo}</Typography>
                    </AccordionDetails>
                </Accordion>
            )}
        </Card>
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
    userId: string;
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
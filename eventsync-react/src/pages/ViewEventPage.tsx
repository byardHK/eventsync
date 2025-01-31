import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Dialog } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { Tag } from '../components/TagModal';
import { useUser } from '../sso/UserContext';
import { set } from 'date-fns';


function ViewEventPage() {
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    // console.log("view events page: ")
    // console.log(currentUserId);
    

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
            console.log(`Sending userId: ${currentUserId}`);
            console.log(`Sending eventId: ${intEventId}`);
            
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
                <Dialog onClose={handleClose} open={open}>
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
                    </Box> */}
                    <Button variant="outlined" fullWidth onClick={handleClose}>Close</Button>
                </Box>
            </Dialog>
        </>
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
                const response = await axios.get(`http://localhost:5000/get_event/${intEventId}`);
                setEvent(response.data);
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        }
        fetchEvent();
    }, [eventId]);

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
                <GetEvent event={event} expanded={expanded} handleChange={handleChange} />
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

function GetEvent({ event, expanded, handleChange }: { event: Event, expanded: string | false, handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void }) {

    
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
    return (
        <Card variant="outlined">
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight={250} minWidth={250} gap={1}>
                <p>{event.title}</p>
                <p>{`Start Time: ${event.startTime}`}</p>
                <p>{`End Time: ${event.endTime}`}</p>
                <p>{`Where?: ${event.locationName}`}</p>
                <p>{`Created By: ${event.creatorId}`}</p>
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
            {event.items && event.items.length > 0 && (
                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Items to Bring</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {event.items.map((item, index) => (
                            <Typography key={index}>{`${item.name}: ${item.quantitySignedUpFor}/${item.amountNeeded}`}</Typography>
                        ))}
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


type Event = {
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
    items: { 
        name: string;
        amountNeeded: number;
        quantitySignedUpFor: number 
    }[];
    venmo: string;
};

interface Rsvp {
    userId: string;
    fname: string;
    lname: string;
};

export default ViewEventPage;
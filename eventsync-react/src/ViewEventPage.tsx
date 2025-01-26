import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BottomNavBar from './BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Accordion, AccordionSummary, AccordionDetails, Typography, Chip, Dialog } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios';
import { Tag } from './TagModal';

const currentUserId = 2;

function ViewEventPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [expanded, setExpanded] = useState<string | false>(false);
    const intEventId = parseInt(eventId || '-1');
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    function RsvpModal(){
        return <>
            <Button variant="outlined" onClick={handleOpen}>RSVP</Button>
            <Dialog 
                onClose={handleClose} 
                open={open}
            >
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center" 
                    sx={{width: "100%"}}
                    minWidth={300}
                >
                    <h2>You have RSVP'd to </h2>
                    <h2>{event?.title}!</h2>
                    <h3>Add to calendar?</h3>
                    <Box
                        display="flex"
                        flexDirection="row"
                        padding={2}
                        gap={2}
                    >
                        <Button variant="outlined" fullWidth onClick={handleClose}>No</Button>
                        <Button variant="outlined" fullWidth onClick={handleClose}>Yes</Button>
                    </Box>
                </Box>
            </Dialog>
        </>
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
            <RsvpModal></RsvpModal>
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
                            <Typography key={index}>{`${item.name}: ${item.amountNeeded} needed, ${item.quantitySignedUpFor} signed up`}</Typography>
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
    items: { 
        name: string;
        amountNeeded: number;
        quantitySignedUpFor: number 
    }[];
    venmo: string;
};

export default ViewEventPage;
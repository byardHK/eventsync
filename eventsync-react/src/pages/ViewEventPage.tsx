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
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { Tag } from '../components/TagModal';
import { useUser } from '../sso/UserContext';


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
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [items, setItems] = useState<Item[]>([]);

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
    
    function RsvpListModal() {
        const [openRsvpList, setOpenRsvpList] = useState(false);
        const [rsvpList] = useState<Rsvp[]>(event?.rsvps || []);
    
        const handleOpenRsvpList = () => {
            setOpenRsvpList(true);
        };
    
        const handleCloseRsvpList = () => setOpenRsvpList(false);
    
        return (
            <>
                <Button variant="outlined" onClick={handleOpenRsvpList}>View RSVP List</Button>
                <Dialog 
                    onClose={handleCloseRsvpList} 
                    open={openRsvpList}
                >
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center" 
                        sx={{width: "100%"}}
                        minWidth={300}
                    >
                        <h2>RSVP List</h2>
                        <ul>
                            {rsvpList.map(rsvp => (
                                <li key={rsvp.userId}>{rsvp.firstName} {rsvp.lastName}</li>
                            ))}
                        </ul>
                        <Button variant="outlined" onClick={handleCloseRsvpList}>Close</Button>
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
                console.log(event);
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        }
        fetchEvent();
    }, [eventId]);

    const handleChange = (panel: string) => (SyntheticEvent: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? panel : false);
    };

    const changeItemsSignedUpFor = (items: Item[]) => {
        if (event){
            var updatedEvent = event;
            updatedEvent.items = items
            setEvent(updatedEvent);
        }
    }

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
                <GetEvent event={event} savedItems={event.items} expanded={expanded} handleChange={handleChange} changeItemsSignedUpFor={changeItemsSignedUpFor}/>
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
                <RsvpListModal/>       
            </Box>
            <BottomNavBar/>
        </Box>
    </>;
};

function GetEvent({ event, savedItems, expanded, handleChange, changeItemsSignedUpFor }: { event: Event, savedItems: Item[], expanded: string | false, handleChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void , changeItemsSignedUpFor: (items: Item[]) => void}) {
    const [items, setItems] = useState<Item[]>(savedItems);
    const [itemSignUpChanged, setItemSignUpChanged] = useState<Boolean>(false);
    
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
        setItemSignUpChanged(true);
        const newItems = [...items];
        newItems[index].myQuantitySignedUpFor += amount;
        if(newItems[index].myQuantitySignedUpFor < 0){
            newItems[index].myQuantitySignedUpFor = 0;
        } else if (newItems[index].myQuantitySignedUpFor + newItems[index].othersQuantitySignedUpFor > items[index].amountNeeded){ // TODO: stuff
            newItems[index].myQuantitySignedUpFor = items[index].amountNeeded - newItems[index].othersQuantitySignedUpFor;
        }
        setItems(newItems);
    }

    async function updateItemsSignedUpFor(item: Item){
        try {
            const postPath = `http://localhost:5000/edit_user_to_item/`;
            const data = {
                'userId': useUser,
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
        } catch (error) {
            console.error('Error fetching event:', error);
        }
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
            {items && items.length > 0 && (
                <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>Items to Bring</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {items.map((item, index) => (
                            <Typography key={index}>{`${item.name}: ${item.othersQuantitySignedUpFor + item.myQuantitySignedUpFor}/${item.amountNeeded}`}
                                <Button variant="contained" onClick={() => changeItemQuantity(-1, index)}>
                                    <RemoveIcon></RemoveIcon>
                                </Button>
                                <h3>{item.myQuantitySignedUpFor}</h3>
                                <Button variant="contained" onClick={() => changeItemQuantity(1, index)}>
                                    <AddIcon></AddIcon> 
                                </Button>
                                <Button variant="text" style={itemSignUpChanged ? { color: "black" } : { color: "gray" }}
                                    onClick={() => updateItemsSignedUpFor(item)}>
                                    <CheckCircleOutlineRoundedIcon></CheckCircleOutlineRoundedIcon>
                                </Button>
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
    items: Item[];
    venmo: string;
    rsvps: Rsvp[];
};

type Rsvp = {
    userId: string;
    firstName: string;
    lastName: string;
};

type Item = {
    name: string;
    amountNeeded: number;
    othersQuantitySignedUpFor: number;
    myQuantitySignedUpFor: number;
    id: number;
}

export default ViewEventPage;
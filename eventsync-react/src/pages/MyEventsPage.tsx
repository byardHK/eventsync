import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Grid2 } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import DeleteRecurEventModal from '../components/DeleteRecurEventModal';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import StyledCard from '../StyledCard';
import EventSyncEvent from '../types/EventSyncEvent';

// const currentUserId = "segulinWH20@gcc.edu"; // Placeholder for the current user that is logged in. TODO: get the actual current user


function MyEventsPage() {
    // console.log("my events page: ")
    // console.log(currentUserId);

    const [isListView, setIsListView] = useState<Boolean>(true); 

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <h1>My Events</h1>
            {/* <Box
                display="flex"
                flexDirection="row"
                gap={2}
            >
                <Button 
                    variant={isListView ? "contained" : "outlined"} 
                    fullWidth
                    onClick={() => {setIsListView(true)}}
                >
                    List
                </Button>
                <Button 
                    variant={!isListView ? "contained" : "outlined"} 
                    fullWidth
                    onClick={() => {setIsListView(false)}}
                >
                    Calendar
                </Button>
            </Box> */
            // uncomment for Sprint 3
            }
            <EventLists/>
            <BottomNavBar></BottomNavBar>
        </Box>
    </>;
};

function EventLists() {
    const [attendingEvents, setAttendingEvents] = useState<EventSyncEvent[]>([]);  
    const [hostingEvents, setHostingEvents] = useState<EventSyncEvent[]>([]);    
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    const navigate = useNavigate()

    const handleCreatEventClick = () => {
        navigate("/createEvent")
    }


    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/get_my_events/${currentUserId}`);
            const res: EventSyncMyEvents = response.data;
            setAttendingEvents(res.attending);
            setHostingEvents(res.hosting);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, [eventsChanged]);

    return (
        <Grid2
            container
            direction="column"
        >
            <h3>Attending</h3>
            <EventList events={attendingEvents} canDeleteEvents={false} setEventsChanged={setEventsChanged}></EventList>
            <Box
                display="flex"
                flexDirection="row"
                gap={2}
            >
                <h3>Hosting</h3>
                <Button variant="contained" onClick={handleCreatEventClick}>
                    <AddIcon/>
                </Button>
            </Box>
            <EventList events={hostingEvents} canDeleteEvents={true} setEventsChanged={setEventsChanged}></EventList>
        </Grid2>
    );
};

function EventList({ events, canDeleteEvents, setEventsChanged }: { events: EventSyncEvent[], canDeleteEvents: Boolean, setEventsChanged: React.Dispatch<React.SetStateAction<Boolean>> }) {
    const navigate = useNavigate();
    async function viewEvent (event: EventSyncEvent) {
        try {
            const response = await axios.post(`http://localhost:5000/addOneView/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        navigate(`/viewEvent/${event.id}`);
    }

    async function editEvent (event: EventSyncEvent) {
        navigate(`/createEvent/${event.id}`);
    }

    async function deleteEvent (event: EventSyncEvent) {
        try {
            const response = await axios.delete(`http://localhost:5000/delete_one_event/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        // try {
        //     const response = await axios.get(`http://localhost:5000/get_events`);
        //     const res: EventSyncEventWithDate[] = response.data;
        //     setEvents(res);
        //     } catch (error) {
        //     console.error('Error fetching data:', error);
        //     }
        setEventsChanged(true);
    }

    function handleDeleteButton(event: EventSyncEvent){
        // if(!event.recurs){
            deleteEvent(event)
        // } else {
        //     return <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}></DeleteRecurEventModal>
        // }
    }

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '30vh', overflow: 'auto'}}
        padding={2}
    >
        {events.map(event =>  
            <StyledCard key={event.id} event={event} viewEvent={viewEvent} showViews>
                {canDeleteEvents && (
                    <Box display="flex" flexDirection="row" gap={2}>
                        <Button fullWidth variant="contained" onClick={() => editEvent(event)}>Edit</Button>
                        <Button fullWidth variant="contained" onClick={() => handleDeleteButton(event)}>Delete</Button>
                    </Box>
                )}
                {/* {canDeleteEvents && (event.recurs ?
                <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}>
                </DeleteRecurEventModal>
                : <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button>
                )}  */}
            </StyledCard>
        )}
    </Grid2>;
};

type EventSyncMyEvents = {
    hosting: EventSyncEvent[];
    attending: EventSyncEvent[];
}

export default MyEventsPage;
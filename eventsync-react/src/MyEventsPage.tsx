import { useEffect, useState } from 'react';
import BottomNavBar from './BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Grid2 } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";
import DeleteRecurEventModal from './DeleteRecurEventModal';
import { useUser } from './UserContext';

const currentUserId = "segulinWH20@gcc.edu"; // Placeholder for the current user that is logged in. TODO: get the actual current user


function MyEventsPage() {
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    console.log("friends page: ")
    console.log(currentUserId);

    const [isListView, setIsListView] = useState<Boolean>(true); 

    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            padding={2}
        >
            <h1>My Events</h1>
            <Box
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

            </Box>
            <EventLists></EventLists>
        </Box>
        <BottomNavBar></BottomNavBar>
    </>;
};

function EventLists() {
    const [attendingEvents, setAttendingEvents] = useState<EventSyncEventWithDate[]>([]);  
    const [hostingEvents, setHostingEvents] = useState<EventSyncEventWithDate[]>([]);    
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);

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

    return <div>
            <h3>Attending</h3>
            <EventList events={attendingEvents} canDeleteEvents={false} setEventsChanged={setEventsChanged}></EventList>
            <Box
                display="flex"
                flexDirection="row"
                gap={2}
                style={{ position: 'absolute', top: "50%" }}
            >
                <h3>Hosting</h3>
                <Button variant="contained" onClick={handleCreatEventClick}>
                    <AddIcon/>
                </Button>
            </Box>
            <EventList events={hostingEvents} canDeleteEvents={true} setEventsChanged={setEventsChanged}></EventList>
        </div>;
};

function EventList({ events, canDeleteEvents, setEventsChanged }: { events: EventSyncEventWithDate[], canDeleteEvents: Boolean, setEventsChanged: React.Dispatch<React.SetStateAction<Boolean>> }) {
    const navigate = useNavigate();
    async function viewEvent (event: EventSyncEventWithDate) {
        console.log(event);
        try {
            const response = await axios.post(`http://localhost:5000/addOneView/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        navigate(`/viewEvent/${event.id}`);
    }

    async function editEvent (event: EventSyncEventWithDate) {
        console.log(event);
        navigate(`/createEvent/${event.id}`);
    }

    async function deleteEvent (event: EventSyncEventWithDate) {
        console.log(event);
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

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '50vh', overflow: 'auto'}}
        padding={2}
    >
        {events.map(event =>
            <Card variant ="outlined" key={event.id}>
                <Box display="flex"
                    flexDirection="column"
                    alignItems="center" 
                    justifyContent="center"
                    minHeight={100}
                    minWidth={250}
                    gap={1}
                >
                    <p>{event.eventName}</p>
                    <p>{event.locationName}</p>
                    {(event.startTime.getDay == event.endTime.getDay) ?
                        <>
                            <p>{format(event.startTime, "EEEE, LLL. do")}</p>
                            <p>{format(event.startTime, "p")} - {format(event.endTime, "p")}</p>
                        </> 
                    : <>
                        <p>{event.startTime.toDateString()}</p>
                        <p>{event.endTime.toDateString()}</p>
                    </>
                    }
                    <Button variant="contained" onClick={() => viewEvent(event)}>View Event</Button>
                    <Button variant="contained" onClick={() => editEvent(event)}>Edit Event</Button>
                    {canDeleteEvents && (event.recurs > 1 ?
                    <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}>
                    </DeleteRecurEventModal>
                    : <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button>
                    )}
                </Box>
            </Card>
        )}
    </Grid2>;
};

type EventSyncEventWithDate = {
    eventName : String;
    // attendees : Number; TODO
    locationName: string;
    // startTime: string;
    // endTime: string;
    id: number;
    startTime: Date;
    endTime: Date;
    recurs: number
}

type EventSyncMyEvents = {
    hosting: EventSyncEventWithDate[];
    attending: EventSyncEventWithDate[];
}

export default MyEventsPage;
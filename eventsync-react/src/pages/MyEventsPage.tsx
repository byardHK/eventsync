import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Grid2 } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import StyledCard from '../StyledCard';
import EventSyncEvent from '../types/EventSyncEvent';
import { BASE_URL } from '../components/Constants';
import logo from '../images/logo.png'; 
import DeleteRecurEventModal from '../components/DeleteRecurEventModal';

function MyEventsPage() {
    // console.log("my events page: ")
    // console.log(currentUserId);

    const { userDetails } = useUser();
    if (!userDetails || !userDetails.email) {
        return <div className="loading-container">
        <img src={logo} alt="EventSync Logo" className="logo" />
        <p className="loading-text">Loading...</p>
        </div>;
    }

    const currentUserId = userDetails.email;

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
            <BottomNavBar userId={currentUserId!}/>
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
            const response = await axios.get(`${BASE_URL}/get_my_events/${currentUserId}`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            const res: EventSyncMyEvents = response.data;
            console.log(res);
            setAttendingEvents(res.attending);
            setHostingEvents(res.hosting);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
        setEventsChanged(false);
    }, [eventsChanged]);

    return (
        <Grid2
            container
            direction="column"
        >
            <h2>Attending</h2>
            <EventList events={attendingEvents} canDeleteEvents={false} setEventsChanged={setEventsChanged}></EventList>
            <Box
                display="flex"
                flexDirection="row"
                gap={2}
            >
                <h2>Hosting</h2>
                <Button title="Add Event Button" variant="contained" onClick={handleCreatEventClick}>
                    <AddIcon/>
                </Button>
            </Box>
            <EventList events={hostingEvents} canDeleteEvents={true} setEventsChanged={setEventsChanged}></EventList>
        </Grid2>
    );
};

function EventList({ events, canDeleteEvents, setEventsChanged }: { events: EventSyncEvent[], canDeleteEvents: Boolean, setEventsChanged: React.Dispatch<React.SetStateAction<Boolean>> }) {
    const navigate = useNavigate();
    const {userDetails} = useUser();
    async function viewEvent (event: EventSyncEvent) {
        try {
            await axios.post(`${BASE_URL}/addOneView/${event.id}/`, {userId: userDetails.email}, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                }
            });
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
            const response = await axios.delete(`${BASE_URL}/delete_one_event/${event.id}/`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        // try {
        //     const response = await axios.get(`${BASE_URL}/get_events`);
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
        style={{maxHeight: '30vh', overflow: 'auto'}}
        padding={2}
    >
        {events.map(event =>  
            <StyledCard key={event.id} event={event} viewEvent={viewEvent} showShareIcon={true} showViews>
                                {canDeleteEvents && (
                    <Box display="flex" flexDirection="row" gap={2}>
                        <Button fullWidth variant="contained" onClick={() => editEvent(event)}>Edit</Button>
                        {canDeleteEvents && (event.recurs > 1 ?
                            <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}>
                            </DeleteRecurEventModal>
                            : <Button fullWidth variant="contained" onClick={() => deleteEvent(event)}>Delete</Button>
                            )} 
                    </Box>
                )}   
            </StyledCard>
        )}
    </Grid2>;
};

type EventSyncMyEvents = {
    hosting: EventSyncEvent[];
    attending: EventSyncEvent[];
}

export default MyEventsPage;
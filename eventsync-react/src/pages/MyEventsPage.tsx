import { useEffect, useState } from 'react';
import BottomNavBar from '../components/BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Grid2, Typography } from '@mui/material';
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
    const [showingAttending, setShowingAttending ] = useState<boolean>(true); 
    const { userDetails } = useUser();
    const navigate = useNavigate()

    const handleCreatEventClick = () => {
        navigate("/createEvent")
    }

    if (!userDetails || !userDetails.email) {
        return <div className="loading-container">
        <img src={logo} alt="EventSync Logo" className="logo" />
        <Typography color="white" className="loading-text">Loading...</Typography>
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
            <Box
                sx={{width: "100%", position: 'fixed', top: '0px', paddingBottom: "10px", backgroundColor: "#1c284c",  "z-index": 10}}
            >
                <Box 
                    display="flex" 
                    flexDirection="row" 
                    padding={1}
                >
                    <Button 
                        variant={showingAttending ? "contained" : "outlined"} 
                        fullWidth
                        onClick={() => {setShowingAttending(true)}}
                        sx={{
                            color: showingAttending
                               ? 'black'
                               : 'white'
                        }}
                    >
                        Attending
                    </Button>
                    <Button 
                        variant={!showingAttending ? "contained" : "outlined"} 
                        fullWidth
                        onClick={() => {setShowingAttending(false)}}
                        sx={{
                            color: !showingAttending
                               ? 'black'
                               : 'white'
                        }}
                    >
                        Hosting
                    </Button>
                </Box>
                {showingAttending ?
                <></>:
                    <>
                        <Button sx={{ width:"100%", marginTop: "5px"}} title="Add Event Button" variant="contained" onClick={handleCreatEventClick}>
                            <AddIcon sx={{color: "black"}}/>
                        </Button>
                    </>
                }
            </Box>
            <EventLists showingAttending={showingAttending}/>
            <BottomNavBar userId={currentUserId!}/>
        </Box>
    </>;
};

type EventListsProps = {
    showingAttending: boolean
};

function EventLists({showingAttending}: EventListsProps) {
    const [attendingEvents, setAttendingEvents] = useState<EventSyncEvent[] | undefined>();
    const [hostingEvents, setHostingEvents] = useState<EventSyncEvent[] | undefined>();
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

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
                const sortedAttending = res.attending.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
                const sortedHosting = res.hosting.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

                setAttendingEvents(sortedAttending);
                setHostingEvents(sortedHosting);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
        setEventsChanged(false);
    }, [eventsChanged]);

    return (
        <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
        >
            <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                    paddingTop: showingAttending
                        ? 8
                        : 14
                }}
                paddingBottom={8}
            >
                {showingAttending ?
                    <EventList events={attendingEvents ? attendingEvents : []} canDeleteEvents={false} setEventsChanged={setEventsChanged} loading={!attendingEvents}/> :
                    <EventList events={hostingEvents ? hostingEvents : []} canDeleteEvents={true} setEventsChanged={setEventsChanged} loading={!hostingEvents}/>
                }
            </Box>
        </Box>
    );
};

function EventList({ events, canDeleteEvents, setEventsChanged, loading }: { events: EventSyncEvent[], canDeleteEvents: Boolean, setEventsChanged: React.Dispatch<React.SetStateAction<Boolean>>, loading: boolean }) {
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
        // padding={2}
    >
        { loading ? <Typography color="white">Loading events...</Typography> :
            (events.length === 0 ?
                (canDeleteEvents ?
                    <Typography color="white">Not hosting any events </Typography> :
                    <Typography color="white">Not attending any events</Typography>
                ) :
                events.map(event =>  
                    <StyledCard height={canDeleteEvents ? 225 : undefined} key={event.id} event={event} viewEvent={viewEvent} showShareIcon={true} showViews>
                        {canDeleteEvents && (
                            <Box display="flex" flexDirection="row" sx={{ '& button': { m: 1 }}}>
                                <Button sx={{backgroundColor: "#1c284c"}} size="small" fullWidth variant="contained" onClick={() => editEvent(event)}>Edit</Button>
                                {canDeleteEvents && (event.recurs > 1 ?
                                    <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}>
                                    </DeleteRecurEventModal>
                                    : <Button sx={{backgroundColor: "#1c284c"}} size="small" fullWidth variant="contained" onClick={() => deleteEvent(event)}>Delete</Button>
                                    )} 
                            </Box>
                        )}   
                    </StyledCard>
                )
            )
        }
    </Grid2>;
};

type EventSyncMyEvents = {
    hosting: EventSyncEvent[];
    attending: EventSyncEvent[];
}

export default MyEventsPage;
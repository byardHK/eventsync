import { useEffect, useState } from 'react';
import BottomNavBar from './BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Grid2 } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import Link from '@mui/icons-material/Link';
import { useNavigate } from 'react-router-dom';
import { format } from "date-fns";

const currentUserId = 2; // Placeholder for the current user that is logged in. TODO: get the actual current user


function MyEventsPage() {

    const [isListView, setIsListView] = useState<Boolean>(true); 
    
    const navigate = useNavigate()

    const handleCreatEventClick = () => {
        navigate("/createEvent")
    }

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
        <Box
            display="flex"
            alignItems="right" 
            justifyContent="right"
            paddingRight={4}
        >
        
            <Button variant="contained" onClick={handleCreatEventClick}>
                <AddIcon/>
            </Button>
           
        </Box>
        <BottomNavBar></BottomNavBar>
    </>;
};

function EventLists() {
    const [attendingEvents, setAttendingEvents] = useState<EventSyncEvent[]>([]);  
    const [hostingEvents, setHostingEvents] = useState<EventSyncEvent[]>([]);    

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/get_my_events/${currentUserId}`);
            const res: EventSyncMyEvents = response.data;
            // for(const event of res.attending){
            //     event.startTimeDate = new Date(event.startTime);
            //     event.endTimeDate = new Date(event.)
            // }
            setAttendingEvents(res.attending);
            setHostingEvents(res.hosting);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
        console.log(attendingEvents[0]);
    }, []);

    return <div>
            <h3>Attending</h3>
            <EventList events={attendingEvents}></EventList>
            <h3>Hosting</h3>
            <EventList events={hostingEvents}></EventList>
        </div>;
};

function EventList({ events }: { events: EventSyncEvent[] }) {

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '19vh', overflow: 'auto'}}
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
                            <p>{format(event.startTime, "EEEE, LLL. Mo")}</p>
                            <p>{format(event.startTime, "p")} - {format(event.endTime, "p")}</p>

                        </> 
                        
                    : <>
                        <p>{event.startTime.toDateString()}</p>
                        <p>{event.endTime.toDateString()}</p>
                    </>
                    }
                </Box>
            </Card>
        )}
    </Grid2>;
};

type EventSyncEvent = {
    eventName : string;
    // attendees : Number; TODO
    locationName: string;
    // startTime: string;
    // endTime: string;
    id: number;
    startTime: Date;
    endTime: Date;
}

type EventSyncMyEvents = {
    hosting: EventSyncEvent[];
    attending: EventSyncEvent[];
}

export default MyEventsPage;
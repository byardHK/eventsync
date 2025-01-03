import { useEffect, useState } from 'react';
import BottomNavBar from './BottomNavBar';
import Box from '@mui/material/Box';
import { Button, Card, Grid2 } from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';


function MyEventsPage() {

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
        <Box
            display="flex"
            alignItems="right" 
            justifyContent="right"
            paddingRight={4}
        >
            <Button variant="contained">
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
            const response = await axios.get('http://localhost:5000/get_my_events/2'); // TODO: fill user placeholder
            const res: EventSyncMyEvents = response.data;
            setAttendingEvents(res.attending);
            setHostingEvents(res.hosting);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    return <div>
            <h3>Hosting</h3>
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
        {events.map((event, index) =>
            <Card variant ="outlined">
                <Box key={index}
                    display="flex"
                    flexDirection="column"
                    alignItems="center" 
                    justifyContent="center"
                    minHeight={100}
                    minWidth={250}
                    gap={1}
                >
                    <p>{`Name: ${event.eventName}`}</p>
                </Box>
            </Card>
        )}
    </Grid2>;
};

type EventSyncEvent = {
    eventName : String;
    // attendees : Number; TODO
    startTime: String;
    endTime: String;
    id: number;
}

type EventSyncMyEvents = {
    hosting: EventSyncEvent[];
    attending: EventSyncEvent[];
}

export default MyEventsPage;
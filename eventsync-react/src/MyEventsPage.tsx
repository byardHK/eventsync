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
            <h3>Hosting</h3>
            <EventList></EventList>
            <h3>Attending</h3>
            <EventList></EventList>
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

function EventList() {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('http://localhost:5000/get_events');
            const res: EventSyncEvent[] = response.data;
            setEvents(res);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

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

export default MyEventsPage;
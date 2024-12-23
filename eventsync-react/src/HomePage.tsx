import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import axios from "axios";
import { Button, Grid2, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import Card from '@mui/material/Card';
import BottomNavBar from './BottomNavBar';

function HomePage() {
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
            flexDirection="row"
            alignItems="center" 
            justifyContent="center"
            padding={2}
            gap={2}
        >
            <Button variant="contained" fullWidth>Coming Soon</Button>
            <Button variant="contained" fullWidth>Recommended</Button>
        </Box>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <TextField 
                id="outlined-basic" 
                label="Search" 
                slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon/>
                        </InputAdornment>
                      ),
                    },
                }}
                variant="outlined"
            />
            <EventList/>
            <BottomNavBar></BottomNavBar>
        </Box>
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

    async function deleteEvent (event: EventSyncEvent) {
        console.log(event);
        try {
            const response = await axios.delete(`http://localhost:5000/delete_one_event/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        try {
            const response = await axios.get('http://localhost:5000/get_events');
            const res: EventSyncEvent[] = response.data;
            setEvents(res);
            } catch (error) {
            console.error('Error fetching data:', error);
            }
    }

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '55vh', overflow: 'auto'}}
        padding={2}
    >
        {events.map((event, index) =>
            <Card variant ="outlined">
                <Box key={index}
                    display="flex"
                    flexDirection="column"
                    alignItems="center" 
                    justifyContent="center"
                    minHeight={250}
                    minWidth={250}
                    gap={1}
                >
                    <p>{`Name: ${event.eventName}`}</p>
                    <p>{`Start Date: ${event.startTime}`}</p>
                    <p>{`End Date: ${event.endTime}`}</p>
                    <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button>
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

export default HomePage;
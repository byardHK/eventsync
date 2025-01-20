import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import axios from "axios";
import { Button, Grid2, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import Card from '@mui/material/Card';
import BottomNavBar from './BottomNavBar';
import ItemModal from './ItemModal';

function HomePage() {
    const [isComingSoon, setIsComingSoon] = useState<Boolean>(true); 
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
           <Button 
                variant={isComingSoon ? "contained" : "outlined"} 
                fullWidth
                onClick={() => {setIsComingSoon(true)}}
            >
                Coming Soon
            </Button>
            <Button 
                variant={!isComingSoon ? "contained" : "outlined"} 
                fullWidth
                onClick={() => {setIsComingSoon(false)}}
            >
                Recommended
            </Button>
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
            <TagModal></TagModal>
            {/* <ItemModal></ItemModal> */}
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
            const response = await axios.get(`http://localhost:5000/get_events`);
            const res: EventSyncEvent[] = response.data;
            setEvents(res);
            } catch (error) {
            console.error('Error fetching data:', error);
            }
    }

    const navigate = useNavigate();

    async function viewEvent (event: EventSyncEvent) {
        console.log(event);
        try {
            const response = await axios.post(`http://localhost:5000/addOneView/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        navigate(`/viewEvent/${event.id}`);
    }

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '55vh', overflow: 'auto'}}
        padding={2}
    >
        {events.map(event =>
            <Card variant ="outlined" key={event.id}>
                <Box 
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
                    <p>{`${event.views} Views`}</p>
                    <Button variant="contained" onClick={() => viewEvent(event)}>View Event</Button>
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
    views: number;
    id: number;
}

export default HomePage;
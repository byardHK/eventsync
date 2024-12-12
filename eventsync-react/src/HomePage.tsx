import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import Box from '@mui/material/Box';
import axios from "axios";
import { Button } from '@mui/material';

function HomePage() {
    return <>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
        >
            <h1>Home Page</h1>
            <EventList/>
            <Link to="/createEvent">Create Event Page</Link>
            <Link to="/friendsPage">Friends Page</Link>
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

    return <ul>
        {events.map((event, index) =>
            <Box key={index}
                display="flex"
                flexDirection="row">
                    <li>{`Name: ${event.eventName} | Start Date: ${event.startTime} | End Date: ${event.endTime}`}</li>
                    <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button>
            </Box>
        )}
    </ul>;
};

type EventSyncEvent = {
    eventName : String;
    // attendees : Number; TODO
    startTime: String;
    endTime: String;
    id: number;
}

export default HomePage;
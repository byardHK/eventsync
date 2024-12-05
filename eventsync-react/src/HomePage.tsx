import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import Box from '@mui/material/Box';
import axios from "axios";

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
        </Box>
    </>;
};

function EventList() {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('http://localhost:5000/get_events'); // Replace with your API endpoint
            const res: EventSyncEvent[] = response.data.events;
            setEvents(res);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    return <ul>
        {events.map((event) =>
            <li>{`Name: ${event.eventName} | Attendees: ${event.attendees}`}</li>
        )}
    </ul>;
};

type EventSyncEvent = {
    eventName : String;
    attendees : Number;
}

export default HomePage;
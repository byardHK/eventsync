import { useEffect, useState } from 'react';
import { Link } from "react-router-dom";

function HomePage() {
    return <>
        <h1>Home Page</h1>
        <EventList/>
        <Link to="/createEvent">Create Event Page</Link>
    </>;
};

function EventList() {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    

    useEffect(() => {
        flask_getEvents().then(setEvents);
    }, []);

    return <ul>
        {events.map((event) =>
            <li>{`Name: ${event.eventName} | Attendees: ${event.attendees}`}</li>
        )}
    </ul>;
};

async function flask_getEvents() : Promise<EventSyncEvent[]> {
    return [
        {
            eventName: "Event 1",
            attendees: 2
        },
        {
            eventName: "Event 2",
            attendees: 3
        },
    ];
};

type EventSyncEvent = {
    eventName : String;
    attendees : Number;
}

export default HomePage;
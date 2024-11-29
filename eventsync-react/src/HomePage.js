import { React, useEffect, useState } from 'react';
import { Link } from "react-router-dom";

const HomePage = () => {
    return <>
        <h1>Home Page</h1>
        <EventList/>
        <Link to="/createEvent">Create Event Page</Link>
    </>;
};

const EventList = () => {
    const [events, setEvents] = useState([]);    

    useEffect(() => {
        flask_getEvents().then(setEvents);
    }, []);

    return <ul>
        {events.map((event) =>
            <li>{`Name: ${event.eventName} | Attendees: ${event.attendees}`}</li>
        )}
    </ul>;
};

const flask_getEvents = async () => {
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

export default HomePage;
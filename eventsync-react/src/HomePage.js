import React from 'react';
import { Link } from "react-router-dom";

const HomePage = () => {
    return <>
        <p>Home Page</p>
        <Link to="/createEvent">Create Event Page</Link>
    </>;
};

export default HomePage;
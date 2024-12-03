import React from 'react';
import { Link } from "react-router-dom";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const CreateEventPage = () => {
    return <>
        <h1>Create Event Page</h1>
        <Box
            component="form"
            sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
            noValidate
            autoComplete="off"
        >
        <TextField id="outlined-basic" label="Title" variant="outlined" />
        <TextField id="outlined-basic" label="Date" variant="outlined" />
        <TextField id="outlined-basic" label="Location" variant="outlined" />
        </Box>
        <Button variant="contained" align="center">Submit</Button>
        <br></br>
        <Link to="/">Home Page</Link>
    </>;
};

export default CreateEventPage;
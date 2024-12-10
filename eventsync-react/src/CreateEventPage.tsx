import { Link } from "react-router-dom";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import { useState } from 'react';


function CreateEventPage() {
    const [titleText, setTitleText] = useState<String>("");    
    const [dateText, setDateText] = useState<String>(""); 
    const [locationText, setLocationText] = useState<String>("");      
    const [tags, setTags] = useState<String[]>([]); 

<<<<<<< Updated upstream
=======
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        try {
            const data = {
                "eventName": "Event 4",
                "attendees": 6
            }
            const response = await fetch('http://localhost:5000/post_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            console.log('Data sent successfully:', response.json());
        } catch (error) {
          console.error('Error sending data:', error);
        }
    };
>>>>>>> Stashed changes
    return <>
        <Box
            display="flex"
            flexDirection="column"
             alignItems="center" 
            justifyContent="center"
        >
            <h1>Create Event Page</h1>
            <Box 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
                component="form"
                sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                noValidate
                autoComplete="off">
                <TextField 
                    id="outlined-basic" 
                    label="Title" 
                    variant="outlined" 
                    type="text" 
                    value={titleText} 
                    onChange={(event) => setTitleText(event.target.value)}  
                />
                <TextField 
                    id="outlined-basic" 
                    label="Date" 
                    variant="outlined" 
                    type="text" 
                    value={dateText} 
                    onChange={(event) => setDateText(event.target.value)}  
                />
                <TextField 
                    id="outlined-basic" 
                    label="Location" 
                    variant="outlined" 
                    type="text" 
                    value={locationText} 
                    onChange={(event) => setLocationText(event.target.value)}  
                />
            </Box>
            <Autocomplete
                multiple
                id="multiple-limit-tags"
                options={tagOptions}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField {...params} label="Tags" 
                        type="text" 
                        value={tags} 
                    />
                )}
                sx={{ width: '500px' }}
                onChange={(_event, value) => { setTags(value); }} 
            />
            <Button variant="contained">Submit</Button>
            <Link to="/">Home Page</Link>
      </Box>
    </>;
}

const tagOptions = [
    "movie",
    "game",
    "outside"
]



export default CreateEventPage;
import { Link } from "react-router-dom";
import Box from '@mui/material/Box';
import TextField, { FilledTextFieldProps, OutlinedTextFieldProps, StandardTextFieldProps, TextFieldVariants } from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import { useState } from 'react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { JSX } from "react/jsx-runtime";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";

function CreateEventPage() {
    const [titleText, setTitleText] = useState<String>("");    
    const [startDateTime, setStartDateTime] = useState<Date | null>(null); 
    const [endDateTime, setEndDateTime] = useState<Date | null>(null); 
    const [locationText, setLocationText] = useState<String>("");      
    const [tags, setTags] = useState<string[]>([]); 

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {

        e.preventDefault();
        try {
            const data = {
                "title": titleText,
                "startDateTime": startDateTime,
                "endDateTime": endDateTime,
                "locationName": locationText,
                "tags": tags
            }
            const response = await fetch('http://localhost:5000/post_event', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
                setTitleText("");
                setStartDateTime(null);
                setEndDateTime(null);
                setLocationText("");
                setTags([]);
            }
           
        } catch (error) {
          console.error('Error sending data:', error);
        }
          
    };

    return <>
        
        <Box
            display="flex"
            flexDirection="column"
             alignItems="center" 
            justifyContent="center"
        >
            <h1>Create Event Page</h1>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                    <MobileDateTimePicker
                        label="Start"
                        value={startDateTime}
                        onChange={(newValue) => setStartDateTime(newValue)} 
                    />
                    <MobileDateTimePicker
                        label="End"
                        value={startDateTime}
                        onChange={(newValue) => setEndDateTime(newValue)} 
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
            </LocalizationProvider>
            <Autocomplete
                multiple
                id="multiple-limit-tags"
                options={tagOptions}
                value={tags}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField {...params} label="Tags" 
                        type="text" 
                    />
                )}
                sx={{ width: '500px' }}
                onChange={(_event, value) => { setTags(value);}} 
            />
            <Button variant="contained" onClick={(e) => handleSubmit(e)}>Submit</Button>
            

            <Link to="/">Home Page</Link>
      </Box>
    </>;
}

const tagOptions = [
    "Movies",
    "Bible Study",
    "Games"
]



export default CreateEventPage;
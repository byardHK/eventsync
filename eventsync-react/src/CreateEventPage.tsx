import { Link } from "react-router-dom";
import { TextField, Box, Button, Typography, FormControlLabel, Checkbox, Switch } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { JSX } from "react/jsx-runtime";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import { Dayjs } from "dayjs";
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TagModal from './TagModal';
import ItemModal from './ItemModal';
import CheckIcon from '@mui/icons-material/Check';
import rootShouldForwardProp from '@mui/material/styles/rootShouldForwardProp';
import { SetStateAction, useState } from 'react';

const currentUserId = 2;

function CreateEventPage() {
    const [titleText, setTitleText] = useState<String>("");    
    const [startDateTime, setStartDateTime] = useState<Dayjs | null>(null); 
    const [endDateTime, setEndDateTime] = useState<Dayjs | null>(null); 
    const [locationText, setLocationText] = useState<String>("");      
    const [tags, setTags] = useState<string[]>([]); 
    const [checked, setChecked] = useState<boolean>(false);
    const [recurFrequency, setRecurFrequency] = useState<string>("Weekly"); 
    const [endRecurDateTime, setEndRecurDateTime] = useState<Dayjs | null>(null); 
    const [venmoText, setVenmoText] = useState<String>("");
    const [isWeatherSensitive, setIsWeatherSensitive] = useState<boolean>(false);
    const [isPrivateEvent, setIsPrivateEvent] = useState<boolean>(false);
    const [rsvpLimit, setRsvpLimit] = useState<number | null>(0);
    const [descriptionText, setDescriptionText] = useState<String>("");


    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {

        e.preventDefault();
        try {
            const postPath = checked ? 'http://localhost:5000/post_recurring_event' : 'http://localhost:5000/post_event';
            const data = {
                "title": titleText,
                "description": descriptionText,
                "startDateTime": startDateTime,
                "endDateTime": endDateTime,
                "locationName": locationText,
                "tags": tags,
                "recurFrequency": recurFrequency,
                "endRecurDateTime": endRecurDateTime,
                "venmo": venmoText,
                "isRecurring": checked,
                "isWeatherSensitive": isWeatherSensitive,
                "isPublic": !isPrivateEvent,
                "rsvpLimit": rsvpLimit
            }
            const response = await fetch(postPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
                setTitleText("");
                setDescriptionText("");
                setStartDateTime(null);
                setEndDateTime(null);
                setLocationText("");
                setTags([]);
                setChecked(false);
                setRecurFrequency("Weekly");
                setEndRecurDateTime(null);
                setVenmoText("");
                setChecked(false);
                setIsWeatherSensitive(false);
                setIsPrivateEvent(false);
                setRsvpLimit(0);
            }
           
        } catch (error) {
          console.error('Error sending data:', error);
        }
          
    };

    function onCheckBoxChange() {
        setChecked(!checked);
    }

    function handleRecurFrequencyChange(newFrequency: string) {
        setRecurFrequency(newFrequency);
    }

    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/myeventspage');
    };

    return <>
        <Box>
            <Box display="flex" alignItems="center" justifyContent="center">
                <Button onClick={handleBackClick}>
                    <ArrowBackIcon />
                </Button>
                <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'center' }}>
                    {`Created By: ${currentUserId}`}
                </Typography>
            </Box>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Box 
                    display="flex" 
                    flexDirection="column"
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
                    <Box display="flex" alignItems="center">
                        <Typography variant="body1">Tags:</Typography>
                        <TagModal/>
                        <Typography variant="body1">Items to Bring:</Typography>
                        <ItemModal/>
                    </Box>
                    <TextField 
                        id="outlined-basic" 
                        label="Description" 
                        variant="outlined" 
                        type="text" 
                        value={descriptionText} 
                        onChange={(event) => setDescriptionText(event.target.value)}  
                    />
                    <TextField 
                        id="outlined-basic" 
                        label="Location" 
                        variant="outlined" 
                        type="text" 
                        value={locationText} 
                        onChange={(event) => setLocationText(event.target.value)}  
                    />
                    <TextField 
                        id="outlined-basic" 
                        label="Venmo" 
                        variant="outlined" 
                        type="text" 
                        value={venmoText} 
                        onChange={(event) => setVenmoText(event.target.value)}  
                    />
                                    <FormControlLabel
                    label="Recurring Event"
                    control={<Checkbox
                                checked={checked}
                                onChange={(event) => setChecked(event.target.checked)} 
                            />}
                />
                {checked ? 
                    <div>
                        <Box alignItems="center" 
                            justifyContent="center"
                        >
                            <FormControl>
                                <InputLabel id="select-frequency">Frequency</InputLabel>
                                <Select
                                    value={recurFrequency}
                                    label="Frequency"
                                    labelId="select-frequency"
                                    onChange={(event) => setRecurFrequency(event.target.value)}
                                >
                                    <MenuItem value={"Daily"}>Daily</MenuItem>
                                    <MenuItem value={"Weekly"}>Weekly</MenuItem>
                                    <MenuItem value={"Monthly"}>Monthly</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box display="flex" 
                            alignItems="center" 
                            justifyContent="center"
                            component="form"
                            sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                            noValidate
                            autoComplete="off">
                        <MobileDateTimePicker
                            label="End Date"
                            value={endRecurDateTime}
                            onChange={(newValue) => setEndRecurDateTime(newValue)} 
                        />
                        </Box>
                    </div>
                : null}
                </Box>
                <Box 
                    display="flex" 
                    flexDirection="column"
                    alignItems="center" 
                    justifyContent="center"
                    component="form"
                    sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                    noValidate
                    autoComplete="off">
                    <FormControlLabel
                        label="Weather Sensitive"
                        control={
                            <Switch
                                checked={isWeatherSensitive}
                                onChange={(event) => setIsWeatherSensitive(event.target.checked)}
                                name="isWeatherSensitive"
                                color="primary"
                            />
                        }
                    />
                    <FormControlLabel
                        label="Private Event"
                        control={
                            <Switch
                                checked={isPrivateEvent}
                                onChange={(event) => setIsPrivateEvent(event.target.checked)}
                                name="isPrivateEvent"
                                color="primary"
                            />
                        }
                    />
                    <TextField 
                        id="outlined-basic" 
                        label="RSVP Limit" 
                        variant="outlined" 
                        type="number" 
                        value={rsvpLimit !== null ? rsvpLimit : ''} 
                        onChange={(event) => {
                            const value = event.target.value === '' ? null : Number(event.target.value);
                            if (value === null || value >= 0) {
                                setRsvpLimit(value);
                            }
                        }}  
                    />
                </Box>
            </LocalizationProvider>
            <Box display="flex" justifyContent="center" mt={2}>
                <a href="https://www.aaiscloud.com/GroveCityC/default.aspx" target="_blank" rel="noopener">
                    Astra Reservations
                </a>
            </Box>
            <Box display="flex" justifyContent="space-between" mt={2}>
                <Button 
                    variant="outlined" 
                    sx={{ minWidth: '40px', minHeight: '40px', padding: 0 }}
                    onClick={handleBackClick}
                >
                    Cancel
                </Button>
                <Button 
                    variant="outlined" 
                    sx={{ minWidth: '40px', minHeight: '40px', padding: 0 }}
                    onClick={handleSubmit}
                >
                    <CheckIcon />
                </Button>
            </Box>
      </Box>
    </>;
}

const tagOptions = [
    "Movies",
    "Bible Study",
    "Games"
]



export default CreateEventPage;
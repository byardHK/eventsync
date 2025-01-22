import { TextField, Box, Button, Typography, FormControlLabel, Checkbox, Switch } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { SetStateAction, useState } from 'react';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { Dayjs } from "dayjs";
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TagModal from './TagModal';
import ItemModal from './ItemModal';
import CheckIcon from '@mui/icons-material/Check';
import rootShouldForwardProp from '@mui/material/styles/rootShouldForwardProp';

const currentUserId = 2;

function CreateEventPage() {
    const [titleText, setTitleText] = useState<String>("");    
    const [descriptionText, setDescriptionText] = useState<String>("");
    const [startDateTime, setStartDateTime] = useState<Dayjs | null>(null); 
    const [endDateTime, setEndDateTime] = useState<Dayjs | null>(null); 
    const [locationText, setLocationText] = useState<String>("");      
    const [tags, setTags] = useState<string[]>([]); 
    const [venmoText, setVenmoText] = useState<String>("");
    const [isRecurring, setIsRecurring] = useState<boolean>(false);
    const [isWeatherSensitive, setIsWeatherSensitive] = useState<boolean>(false);
    const [isPrivateEvent, setIsPrivateEvent] = useState<boolean>(false);
    const [rsvpLimit, setRsvpLimit] = useState<number | null>(0);
    const [items, setItems] = useState<Item[]>([])

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {

        e.preventDefault();
        try {
            const data = {
                "title": titleText,
                "description": descriptionText,
                "startDateTime": startDateTime,
                "endDateTime": endDateTime,
                "locationName": locationText,
                "tags": tags,
                "venmo": venmoText,
                "isRecurring": isRecurring,
                "isWeatherSensitive": isWeatherSensitive,
                "isPublic": !isPrivateEvent,
                "rsvpLimit": rsvpLimit,
                "items": items
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
                setDescriptionText("");
                setStartDateTime(null);
                setEndDateTime(null);
                setLocationText("");
                setTags([]);
                setVenmoText("");
                setIsRecurring(false);
                setIsWeatherSensitive(false);
                setIsPrivateEvent(false);
                setRsvpLimit(0);
                setItems([]);
            }
           
        } catch (error) {
          console.error('Error sending data:', error);
        }
          
    };

    function itemsToParent(items: Item[]) {
        setItems(items);
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
                    <Box display="flex" alignItems="center">
                        <Typography variant="body1">Tags:</Typography>
                        <TagModal/>
                        <Typography variant="body1">Items to Bring:</Typography>
                        <ItemModal itemsToParent={itemsToParent} />
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
                    <Box display="flex" flexDirection="row" gap={2}>
                        <MobileDateTimePicker
                            label="Start"
                            value={startDateTime}
                            onChange={(newValue: SetStateAction<Dayjs | null>) => setStartDateTime(newValue)} 
                        />
                        <MobileDateTimePicker
                            label="End"
                            value={startDateTime}
                            onChange={(newValue: SetStateAction<Dayjs | null>) => setEndDateTime(newValue)} 
                        />
                    </Box>
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
                        control={
                            <Checkbox
                                checked={isRecurring}
                                onChange={(event) => setIsRecurring(event.target.checked)}
                                name="isRecurring"
                                color="primary"
                            />
                        }
                    />
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

type Item = {
    id: number;
    description: String;
    amountNeeded: number;
    quantityAccountedFor: number;
    isFull: Boolean;
    event: number;
};

export default CreateEventPage;
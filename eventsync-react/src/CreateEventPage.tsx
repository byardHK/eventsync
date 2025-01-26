import { Link } from "react-router-dom";
import { TextField, Box, Button, Typography, FormControlLabel, Checkbox, Switch, Chip } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { SetStateAction, useEffect, useState } from 'react';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { JSX } from "react/jsx-runtime";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TagModal, { Tag } from './TagModal';
import ItemModal from './ItemModal';
import CheckIcon from '@mui/icons-material/Check';
import rootShouldForwardProp from '@mui/material/styles/rootShouldForwardProp';
import axios from "axios";

const currentUserId = "minnichjs21@gcc.edu";

function CreateEventPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const [titleText, setTitleText] = useState<String>("");    
    const [startDateTime, setStartDateTime] = useState<Dayjs | null>(null); 
    const [endDateTime, setEndDateTime] = useState<Dayjs | null>(null); 
    const [checked, setChecked] = useState<boolean>(false);
    const [recurFrequency, setRecurFrequency] = useState<string>("Weekly"); 
    const [endRecurDateTime, setEndRecurDateTime] = useState<Dayjs | null>(null); 
    const [locationText, setLocationText] = useState<String>("");
    const [tags, setTags] = useState<Tag[]>([]); 
    const [venmoText, setVenmoText] = useState<String>("");
    const [isWeatherSensitive, setIsWeatherSensitive] = useState<boolean>(false);
    const [isPrivateEvent, setIsPrivateEvent] = useState<boolean>(false);
    const [rsvpLimit, setRsvpLimit] = useState<number | null>(0);
    const [descriptionText, setDescriptionText] = useState<String>("");
    const [editAllEvents, setEditAllEvents] = useState<boolean>(true);

    // const [eventTagsTrigger, setEventTagsTrigger] = useState<number>(0);

    // function reloadEventTags() {
    //     setEventTagsTrigger(eventTagsTrigger+1);
    // }
    
    function ListTags(){
        return <>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
            >
                {tags.map((tag, index) =>
                <Box 
                    key={index}
                >    
                    <Chip label={tag.name}></Chip>
                </Box>
            )}
            </Box>
        </>
    }

    // useEffect(() => {
    //     const fetchData = async () => {
    //         try {
    //             const response = await axios.get(`http://localhost:5000/get_event_tags/${eventInfoId}/`);
    //             const res: Tag[] = response.data;
    //             setTags(res);
    //         } catch (error) {
    //             console.error('Error fetching tags:', error);
    //         }
    //     };
    //     fetchData();
    // }, [eventTagsTrigger]);

    const handleSave = async (tagsToAdd: Tag[], tagsToDelete: Tag[]) => {
        const newTags: Tag[] = [...tags];

        tagsToAdd.forEach(tag=> {
            newTags.push(tag);
        });
        
        const filteredTags = newTags.filter((tag) => {
            return !tagsToDelete.includes(tag);
        });

        setTags(filteredTags);


    //     try {
    //         const deselectedData = {
    //             "deselectedTags": tagsToDelete,
    //             "eventInfoId": 1
    //         }
    //         const deleteResponse = await fetch(`http://localhost:5000/delete_event_deselected_tags/`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(deselectedData),
    //         });
    //         const selectedData = {
    //             "selectedTags": tagsToAdd,
    //             "eventInfoId": 1
    //         }
    //         const saveResponse = await fetch(`http://localhost:5000/save_event_selected_tags/`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify(selectedData),
    //         });
    //         if(deleteResponse.ok && saveResponse.ok){
    //             console.log('Data sent successfully:', deleteResponse.json());
    //         }
    //     } catch (error) {
    //         console.error('Error sending data:', error);
    //     }

        // reloadEventTags();
    };
    useEffect(() => {
        if (eventId) {
            const fetchEvent = async () => {
                try {
                    const response = await axios.get(`http://localhost:5000/get_event/${eventId}`);
                    const event = response.data;
                    console.log("Fetched event data:", event);
                    setTitleText(event.title);
                    setDescriptionText(event.description);
                    setStartDateTime(dayjs(event.startTime));
                    setEndDateTime(dayjs(event.endTime));
                    setLocationText(event.locationName);
                    setTags(event.tags || []);
                    setChecked(event.isRecurring || false);
                    setRecurFrequency(event.recurFrequency || "Weekly");
                    setEndRecurDateTime(event.endRecurDateTime ? dayjs(event.endRecurDateTime) : null);
                    setVenmoText(event.venmo || "");
                    setIsWeatherSensitive(event.isWeatherSensitive || false);
                    setIsPrivateEvent(event.isPublic !== undefined ? !event.isPublic : false);
                    setRsvpLimit(event.rsvpLimit !== undefined ? event.rsvpLimit : 0);
                } catch (error) {
                    console.error('Error fetching event:', error);
                }
            };
            fetchEvent();
        }
    }, [eventId]);

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const postPath = eventId ? `http://localhost:5000/editEvent/${eventId}` : (checked ? 'http://localhost:5000/post_recurring_event' : 'http://localhost:5000/post_event');
            const data = {
                "creatorId": currentUserId,
                "title": titleText,
                "description": descriptionText,
                "startDateTime": startDateTime,
                "endDateTime": endDateTime || startDateTime,
                "locationName": locationText,
                "tags": tags,
                "recurFrequency": recurFrequency,
                "endRecurDateTime": endRecurDateTime,
                "venmo": venmoText,
                "isRecurring": checked,
                "isWeatherSensitive": isWeatherSensitive,
                "isPublic": !isPrivateEvent,
                "rsvpLimit": rsvpLimit,
                "editAllEvents": editAllEvents
            }
            const response = await fetch(postPath, {
                method: eventId ? 'PUT' : 'POST',
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
                setEditAllEvents(true);
                navigate('/myeventspage');
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
                <Box display="flex" flexDirection="column">
                    <Typography variant="body1">
                        {eventId ? "Edit Event" : "Create Event"}
                    </Typography>
                    {eventId && (
                        <FormControlLabel
                            label={<Typography variant="body1">Edit all events in this group</Typography>}
                            control={
                                <Checkbox
                                    checked={editAllEvents}
                                    onChange={(e) => setEditAllEvents(e.target.checked)}
                                />
                            }
                        />
                    )}
                </Box>
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
                        <TagModal savedTags={tags} handleSave={handleSave}></TagModal>
                        <Typography variant="body1">Items to Bring:</Typography>
                        <ItemModal/>
                    </Box>
                    <ListTags></ListTags>
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
                            />
                        }
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

export default CreateEventPage;
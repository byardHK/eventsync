import { TextField, Box, Button, Typography, FormControlLabel, Checkbox, Switch, Chip, Accordion, AccordionSummary, AccordionDetails, FormLabel, RadioGroup } from '@mui/material';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import dayjs, { Dayjs } from "dayjs";
import { useNavigate, useParams } from 'react-router-dom';
import TagModal from '../components/TagModal';
import ItemModal from '../components/ItemModal';
import CheckIcon from '@mui/icons-material/Check';
import axios from "axios";
import { useUser } from "../sso/UserContext";
import { useEffect, useState } from 'react';
import "../styles/style.css"
import Tag from '../types/Tag';
import { BASE_URL } from '../components/Constants';
import BackButton from '../components/BackButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import Radio from '@mui/material/Radio';

function CreateEventPage() {
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const { eventId } = useParams<{ eventId: string }>();
    const [eventInfoId, setEventInfoId] = useState<number | null>(null);
    const [titleText, setTitleText] = useState<String>("");    
    const [startDateTime, setStartDateTime] = useState<Dayjs | null>(null); 
    const [endDateTime, setEndDateTime] = useState<Dayjs | null>(null); 
    const [checked, setChecked] = useState<boolean>(false);
    const [recurFrequency, setRecurFrequency] = useState<string>(""); 
    const [endRecurDateTime, setEndRecurDateTime] = useState<Dayjs | null>(null); 
    const [locationText, setLocationText] = useState<String>("");
    const [tags, setTags] = useState<Tag[]>([]); 
    const [venmoText, setVenmoText] = useState<String>("");
    const [isWeatherSensitive, setIsWeatherSensitive] = useState<boolean>(false);
    const [isPrivateEvent, setIsPrivateEvent] = useState<boolean>(false);
    const [rsvpLimit, setRsvpLimit] = useState<number | null>(0);
    const [items, setItems] = useState<Item[]>([])
    const [descriptionText, setDescriptionText] = useState<String>("");
    const [editAllEvents, setEditAllEvents] = useState<boolean>(true);
    const [creatorName, setCreatorName] = useState<String>(userDetails.firstName + " " + userDetails.lastName);
    const [eventTagsTrigger, setEventTagsTrigger] = useState<number>(0);
    const [isGeneralAccordionOpen, setIsGeneralAccordionOpen] = useState(true);

    const [titleError, setTitleError] = useState(false);
    const [startDateTimeError, setStartDateTimeError] = useState(false);
    const [endDateTimeError, setEndDateTimeError] = useState(false);
    const [descriptionError, setDescriptionError] = useState(false);
    const [locationError, setLocationError] = useState(false);

    function reloadEventTags() {
        setEventTagsTrigger(eventTagsTrigger+1);
    }
    
    function ListTags(){
        return <>
            <Box
                display="flex"
                flexDirection="row"
                // alignItems="center"
                // justifyContent="center"
                flexWrap="wrap"
            >
                {tags.map((tag, index) =>
                <Box 
                    key={index}
                >    
                    <Chip sx={{margin: 1, backgroundColor: '#71A9F7', color: "black"}} label={tag.name}></Chip>
                </Box>
            )}
            </Box>
        </>
    }

    function ListItems(){
        return <>
            <Box
                display="flex"
                flexDirection="row"
                // alignItems="center"
                // justifyContent="center"
                flexWrap="wrap"
            >
                {items.map((item, index) =>
                <Box 
                    key={index}
                >    
                    <Chip sx={{margin: 1, backgroundColor: '#71A9F7', color: "black"}} label={`${item.description} : ${item.amountNeeded}`}></Chip>
                </Box>
            )}
            </Box>
        </>
    }

    const handleSave = async (tagsToAdd: Tag[], tagsToDelete: Tag[]) => {
        const newTags: Tag[] = [...tags];

        tagsToAdd.forEach(tag=> {
            newTags.push(tag);
        });
        
        const filteredTags = newTags.filter((tag) => {
            return !tagsToDelete.includes(tag);
        });

        setTags(filteredTags);


        try {
            const deselectedData = {
                "deselectedTags": tagsToDelete,
                "eventInfoId": eventInfoId,
                "userId": currentUserId
            }
            const deleteResponse = await fetch(`${BASE_URL}/delete_event_deselected_tags/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deselectedData),
            });
            const selectedData = {
                "selectedTags": tagsToAdd,
                "eventInfoId": eventInfoId,
                "userId": currentUserId
            }
            const saveResponse = await fetch(`${BASE_URL}/save_event_selected_tags/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedData),
            });
            if(deleteResponse.ok && saveResponse.ok){
                console.log('Data sent successfully:', deleteResponse.json());
            }
        } catch (error) {
            console.error('Error sending data:', error);
        }

        reloadEventTags();
    };
    
    useEffect(() => {
        if (eventId) {
            const fetchEvent = async () => {
                if(!currentUserId){
                    return;
                }
                try {
                    const response = await axios.get(`${BASE_URL}/get_event/${eventId}/${currentUserId}`,{
                        headers: {
                            'Authorization': `Bearer ${userDetails.token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    const event = response.data;
                    console.log("Fetched event data:", event);
                    setEventInfoId(event.eventInfoId);
                    setTitleText(event.title);
                    setDescriptionText(event.description);
                    setStartDateTime(dayjs(event.startTime));
                    setEndDateTime(dayjs(event.endTime));
                    setLocationText(event.locationName);
                    setTags(event.tags || []);
                    setRecurFrequency(event.recurFrequency || "");
                    setVenmoText(event.venmo || "");
                    setIsWeatherSensitive(event.isWeatherSensitive || false);
                    setIsPrivateEvent(event.isPublic !== undefined ? !event.isPublic : false);
                    setRsvpLimit(event.rsvpLimit !== undefined ? event.rsvpLimit : 0);
                    setCreatorName(event.creatorName);

                    const recurringResponse = await axios.get(`${BASE_URL}/get_events_by_eventInfoId/${event.eventInfoId}`, {
                        headers: {
                            'Authorization': `Bearer ${userDetails.token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                    const recurringEvents = recurringResponse.data;

                    if (recurringEvents.length > 1) {
                        setChecked(true);
                        const sortedRecurringEvents = recurringEvents.sort(
                            (a: any, b: any) => new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
                        );
                        const lastEventEndTime = dayjs(sortedRecurringEvents[sortedRecurringEvents.length - 1].endTime);
                        setEndRecurDateTime(lastEventEndTime.add(1, "hour"));
                    } else {
                        setChecked(false);
                        setEndRecurDateTime(null);
                    }
                } catch (error) {
                    console.error('Error fetching event:', error);
                }
            };
            fetchEvent();
        }
    }, [eventId, userDetails]);

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();

        setTitleError(false);
        setStartDateTimeError(false);
        setEndDateTimeError(false);
        setDescriptionError(false);
        setLocationError(false);

        if (!titleText.trim()) setTitleError(true);
        if (!startDateTime) setStartDateTimeError(true);
        if (!endDateTime) setEndDateTimeError(true);
        if (!descriptionText.trim()) setDescriptionError(true);
        if (!locationText.trim()) setLocationError(true);

        if (!titleText.trim() || !startDateTime || !endDateTime || !descriptionText.trim() || !locationText.trim()) {
            setIsGeneralAccordionOpen(true);
            window.scrollTo(0, 0);
            return;
        }

        try {
            const postPath = eventId ? `${BASE_URL}/editEvent/${eventId}` : (checked ? `${BASE_URL}/post_recurring_event` : `${BASE_URL}/post_event`);
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
                "items": items,
                "editAllEvents": editAllEvents,
                "creatorName": creatorName
            }
            const response = await fetch(postPath, {
                method: eventId ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
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
                setRecurFrequency("");
                setEndRecurDateTime(null);
                setVenmoText("");
                setChecked(false);
                setIsWeatherSensitive(false);
                setIsPrivateEvent(false);
                setRsvpLimit(0);
                setItems([]);
                setEditAllEvents(true);
                setCreatorName("");
                navigate('/myEvents');
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
        navigate('/myEvents');
    };

    return <>
         <Box
                display="flex"
                flexDirection="column"
                // alignItems="center"
                // justifyContent="center"
                paddingBottom={3}
                paddingTop={10}
            >
                <Box display="flex" gap={5} flexDirection="row" sx={{width: "100%", position: 'fixed', paddingTop: 2, top: '0px', backgroundColor: "#1c284c",  "z-index": 10}}>
                    <BackButton></BackButton>
                    <Typography color="white" fontWeight="bold" variant="h4">
                        {eventId ? "Edit Event" : "Create Event"}
                    </Typography>
                </Box>
                    {eventId && (
                        <FormControlLabel
                            label={<Typography color="white">Edit all events in this group</Typography>}
                            control={
                                <Checkbox
                                    checked={editAllEvents}
                                    onChange={(e) => setEditAllEvents(e.target.checked)}
                                />
                            }
                        />
                    )}
            <Accordion 
                defaultExpanded 
                disableGutters             
                expanded={isGeneralAccordionOpen}
                onChange={() => setIsGeneralAccordionOpen(!isGeneralAccordionOpen)}
                sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    <Typography sx={{color: "white"}} variant="h4" component="span">General</Typography>
                </AccordionSummary>
                <AccordionDetails>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box 
                        display="flex" 
                        flexDirection="column"
                        // alignItems="center" 
                        // justifyContent="center"
                        component="form"
                        noValidate
                        autoComplete="off"
                        gap={1.5}
                    >
                        <TextField 
                            sx={{input: {backgroundColor: 'white'}, width: "100%"}}
                            id="outlined-basic" 
                            label="Title" 
                            variant="outlined" 
                            type="text" 
                            value={titleText} 
                            onChange={(event) => {
                                const value = event.target.value;
                                if (value.length <= 50) {
                                    setTitleText(value);
                                } 
                            }}
                            error={titleError}
                            helperText={titleError ? "Title is required" : ""}
                        />
                        <Box gap={2} display="flex" flexDirection="row" width="100%" justifyContent="flex-end">
                            <AccessAlarmIcon style={{color: "white"}}></AccessAlarmIcon>
                            <Typography color="white"> FROM </Typography>
                            <MobileDateTimePicker
                                // slotProps={{
                                //     toolbar: {
                                //     sx: {
                                //         "& .MuiPickersToolbarText-root": {
                                //         color: "red"
                                //         }
                                //     }
                                //     },
                                //     day: {
                                //     sx: {
                                //         color: "red"
                                //     }
                                //     }
                                // }}
                                sx={{ input: { backgroundColor: "white" }, width: "80%" }}
                                label="Start"
                                value={startDateTime}
                                onChange={(newValue) => {
                                    setStartDateTime(newValue);
                                    setEndDateTime(newValue ? newValue.add(1, "hour") : null);
                                }}
                                minDateTime={dayjs()}
                                slotProps={{
                                    textField: {
                                        error: startDateTimeError,
                                        helperText: startDateTimeError ? "Start date and time are required" : "",
                                    },
                                }}
                            />
                        </Box>
                        <Box gap={2} display="flex" flexDirection="row" width="100%" justifyContent="flex-end">
                            <Typography sx={{paddingLeft:8.25}} color="white"> TO </Typography>
                            <MobileDateTimePicker
                                sx={{input: {backgroundColor: 'white'}, width: "80%"}}
                                label="End"
                                value={endDateTime}
                                onChange={(newValue) => setEndDateTime(newValue)} 
                                minDateTime={startDateTime || dayjs()}
                                slotProps={{
                                    textField: {
                                        error: endDateTimeError,
                                        helperText: endDateTimeError ? "End date and time are required" : "",
                                    },
                                }}
                            />
                        </Box>
                        <TextField 
                            sx={{input: {backgroundColor: 'white'}, width: "100%"}}
                            id="outlined-basic" 
                            label="Description" 
                            variant="outlined" 
                            type="text" 
                            value={descriptionText} 
                            onChange={(event) => {
                                const value = event.target.value;
                                if (value.length <= 100) {
                                    setDescriptionText(value);
                                } 
                            }}
                            error={descriptionError}
                            helperText={descriptionError ? "Description is required" : ""}
                        />
                        <TextField 
                            sx={{input: {backgroundColor: 'white'}, width: "100%"}}
                            id="outlined-basic" 
                            label="Location" 
                            variant="outlined" 
                            type="text" 
                            value={locationText}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (value.length <= 50) {
                                    setLocationText(value);
                                } 
                            }}
                            error={locationError}
                            helperText={locationError ? "Location is required" : ""}
                        />
                    </Box>
                    </LocalizationProvider>
                </AccordionDetails>
            </Accordion>
            <Accordion disableGutters sx={{backgroundColor: "#1c284c", width: "100%", border: "1px solid #FFF"}}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon style={{color: "white"}}/>}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    <Typography sx={{color: "white"}} variant="h4" component="span">Advanced</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box display="flex" flexDirection="column"  gap={1} paddingTop={2}>
                        <Box display="flex" flexDirection="row" gap={1}>
                            <Typography variant="h5" color="white">Tags:</Typography>
                            <TagModal savedTags={tags} handleSave={handleSave}></TagModal>
                        </Box>
                        <ListTags></ListTags>
                        <br></br>
                        <Box display="flex" flexDirection="row" gap={1}>
                            <Typography variant="h5"color="white">Items to Bring:</Typography>
                            <ItemModal itemsToParent={itemsToParent} />
                        </Box>
                        <ListItems></ListItems>
                        <br></br>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <FormControlLabel
                                sx={{color: "white", fontSize:"h1"}}
                                label={<Typography variant="h5">Recurring Event</Typography>}
                                control={<Checkbox
                                    sx={{color: "white"}}
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
                                        <Typography color="white">Frequency</Typography>
                                        <FormControl>
                                            <RadioGroup
                                                value={recurFrequency}
                                                onChange={(event) => setRecurFrequency(event.target.value)}
                                                sx={{ minWidth: '15ch', color: "white" }}
                                                aria-labelledby="demo-radio-buttons-group-label"
                                                defaultValue="female"
                                                name="radio-buttons-group"
                                            >
                                                <FormControlLabel value={"Daily"} control={<Radio sx={{color: "white"}} />} label="Daily" />
                                                <FormControlLabel value={"Weekly"} control={<Radio sx={{color: "white"}}/>} label="Weekly" />
                                                <FormControlLabel value={"Monthly"} control={<Radio sx={{color: "white"}}/>} label="Monthly" />
                                            </RadioGroup>
                                        </FormControl>
                                    </Box>
                                    <Box display="flex" 
                                        // alignItems="center" 
                                        // justifyContent="center"
                                        component="form"
                                        sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                                        noValidate
                                        autoComplete="off">
                                    <MobileDateTimePicker
                                        sx={{backgroundColor: "white"}}
                                        label="End Date"
                                        value={endRecurDateTime}
                                        onChange={(newValue) => setEndRecurDateTime(newValue)} 
                                        minDateTime={startDateTime || dayjs()}
                                    />
                                    </Box>
                                </div>
                            : null}
                        </LocalizationProvider>
                        <br></br>
                        <TextField 
                            sx={{input: {backgroundColor: 'white'}}}
                            id="outlined-basic" 
                            label="Venmo" 
                            variant="outlined" 
                            type="text" 
                            value={venmoText} 
                            onChange={(event) => {
                                const value = event.target.value;
                                if (value.length <= 25) {
                                    setVenmoText(value);
                                } 
                            }}
                            
                        />
                    </Box>
                    <br></br>
                    {<Box 
                        display="flex" 
                        flexDirection="column"
                        // alignItems="center" 
                        // justifyContent="center"
                        component="form"
                        sx={{ '& > :not(style)': { m: 1, width: '25ch' } }}
                        noValidate
                        autoComplete="off">
                        <FormControlLabel
                            label="Private Event"
                            sx={{color: "white"}}
                            control={
                                <Switch
                                    checked={isPrivateEvent}
                                    onChange={(event) => setIsPrivateEvent(event.target.checked)}
                                    name="isPrivateEvent"
                                    color="primary"
                                />
                            }
                        />
                        <br></br>
                        <Typography color="white">RSVP Limit</Typography>
                        <TextField
                            sx={{input: {backgroundColor: 'white'}}}
                            id="outlined-basic" 
                            // label="RSVP Limit" 
                            variant="outlined" 
                            type="number" 
                            value={rsvpLimit !== null ? rsvpLimit : ''} 
                            onChange={(event) => {
                                const value = event.target.value === '' ? null : Number(event.target.value);
                                if (value === null || (value >= 0 && value <= 999)) {
                                    setRsvpLimit(value);
                                }
                            }}  
                        />
                        
                    </Box>
                    }
                </AccordionDetails>
            </Accordion>
        </Box>
        <Box display="flex" justifyContent="right" alignItems="right">
            <Button 
                variant="contained" 
                sx={{ minWidth: '40px', minHeight: '40px', padding: 2, color: "black" }}
                onClick={handleSubmit}
                title="submit"
            >
                Save
            </Button>
        </Box>
    </>;

}

type Item = {
    id: number;
    description: String;
    amountNeeded: number;
    quantityAccountedFor: number;
    isFull: Boolean;
    event: number;
};

export default CreateEventPage;
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import axios from "axios";
import { Button, Grid2, InputAdornment, TextField, Autocomplete } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import BottomNavBar from '../components/BottomNavBar';
import { Link } from 'react-router-dom';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import StyledCard from '../StyledCard';
import FlagIcon from '@mui/icons-material/Flag';
import EventSyncEvent from '../types/EventSyncEvent';
import { BASE_URL } from '../components/Cosntants';

function HomePage() {
    const { userDetails } = useUser();
    console.log("home page user details: ", userDetails);
    const currentUserId = userDetails.email;
    const [searchKeyword, setSearchKeyword] = useState('');
    const [tags] = useState<string[]>([]);
    const [tagOptions, setTagOptions] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const fetchTags = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_tags`);
                setTagOptions(response.data.map((tag: { name: string }) => tag.name));
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchTags();
    }, []);
    
    const [isComingSoon, setIsComingSoon] = useState<Boolean>(true); 
    return <>
        <Box
            display="flex"
            alignItems="right" 
            justifyContent="right"
            padding={2}
            gap={2}
        >
            <Link to="/admin">
                <Button variant="contained">
                    <FlagIcon/>
                </Button>
            </Link>
            
            <Link to={`/profile/${currentUserId}`}>
                <Button variant="contained">
                    <PersonIcon/>
                </Button>
            </Link>
            
        </Box>
        <Box
            display="flex"
            alignItems="center" 
            justifyContent="center"
        >
            <h3 className="card-title">Welcome {userDetails.firstName}! 👋</h3>
        </Box>

        <Box
            display="flex"
            flexDirection="row"
            alignItems="center" 
            justifyContent="center"
            padding={2}
            gap={2}
        >
           <Button 
                variant={isComingSoon ? "contained" : "outlined"} 
                fullWidth
                onClick={() => {setIsComingSoon(true)}}
            >
                Coming Soon
            </Button>
            <Button 
                variant={!isComingSoon ? "contained" : "outlined"} 
                fullWidth
                onClick={() => {setIsComingSoon(false)}}
            >
                Recommended
            </Button> 
        </Box> 
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            gap={2}
        >
            <TextField 
                sx={{input: {backgroundColor: 'white'}}}
                id="outlined-basic" 
                label="Search" 
                onChange={(e) => setSearchKeyword(e.target.value)}
                slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon/>
                        </InputAdornment>
                      ),
                    },
                }}
                variant="outlined"
            />
            <Autocomplete
                multiple
                id="multiple-limit-tags"
                options={tagOptions}
                value={tags}
                getOptionLabel={(option) => option}
                renderInput={(params) => (
                    <TextField {...params} label="Tags" type="text" />
                )}
                sx={{ width: '255px' }}
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                open={inputValue !== ''}
            />
            <EventList searchKeyword={searchKeyword} tags={tags}/>

            
            
        </Box>
        <BottomNavBar userId={currentUserId!}/>
    </>;
};

function EventList({searchKeyword, tags}: {searchKeyword: string, tags: string[]}) {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`${BASE_URL}/get_events`);
            const res: EventSyncEvent[] = response.data;
            setEvents(res);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        setEventsChanged(false);
        fetchData();
    }, [eventsChanged]);

    // async function deleteEvent (event: EventSyncEvent) {
    //     console.log(event);
    //     try {
    //         const response = await axios.delete(`${BASE_URL}/delete_one_event/${event.id}/`);
    //         console.log(response);
    //     } catch (error) {
    //         console.error('Error fetching data:', error);
    //     }
    //     try {
    //         const response = await axios.get(`${BASE_URL}/get_events`);
    //         const res: EventSyncEvent[] = response.data;
    //         setEvents(res);
    //         } catch (error) {
    //         console.error('Error fetching data:', error);
    //         }
    // }

    // function handleDeleteButton(event: EventSyncEvent){
    //     if(!event.recurs){
    //         deleteEvent(event)
    //     } else {

    //     }
    // }

    const navigate = useNavigate();

    async function viewEvent (event: EventSyncEvent) {
        console.log(event);
        try {
            const response = await axios.post(`${BASE_URL}/addOneView/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        navigate(`/viewEvent/${event.id}`);
    }

    const filteredEvents = events.filter(event => {
        const matchesKeyword = searchKeyword
            ? event.eventName.toLowerCase().includes(searchKeyword.toLowerCase())
            : true;
        const matchesTags = tags.length > 0
            ? tags.every(tag => event.tags && event.tags.map(t => t.name).includes(tag))
            : true;
        return matchesKeyword && matchesTags;
    });

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '58vh', overflow: 'auto'}}
        padding={2}
    >
        {filteredEvents.map(event =>
        //TODO: Replace
            // <Card variant ="outlined" key={event.id}>
            //     <Box 
            //         display="flex"
            //         flexDirection="column"
            //         alignItems="center" 
            //         justifyContent="center"
            //         minHeight={250}
            //         minWidth={250}
            //         gap={1}
            //     >
            //         <p>{`Name: ${event.eventName}`}</p>
            //         <p>{`Start Date: ${event.startTime}`}</p>
            //         <p>{`End Date: ${event.endTime}`}</p>
            //         <p>{`${event.views} Views`}</p>
            //         <Button variant="contained" onClick={() => viewEvent(event)}>View Event</Button>
            //         <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button>
            //         <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}>
            //         </DeleteRecurEventModal>
            //     </Box>
            // </Card>
            // <Box >
                <StyledCard key={event.id} event={event} viewEvent={viewEvent} showShareIcon={false} showTags>
                    {/* <Button variant="contained" onClick={() => viewEvent(event)}>View Event</Button>
                    <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button> */}
                    {/* <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}> */}
                    {/* </DeleteRecurEventModal> */}
                </StyledCard>
            // </Box>
        )}
    </Grid2>;
};

export default HomePage;
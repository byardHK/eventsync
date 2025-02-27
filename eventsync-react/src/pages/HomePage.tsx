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
import { BASE_URL } from '../components/Constants';
import logo from '../images/logo.png'; 

function HomePage() {
    const { userDetails } = useUser();
    if (!userDetails || !userDetails.email) {
        return <div className="loading-container">
        <img src={logo} alt="EventSync Logo" className="logo" />
        <p className="loading-text">Loading...</p>
        </div>;
    }
    console.log("home page user details: ", userDetails);
    const currentUserId = userDetails.email;
    const [searchKeyword, setSearchKeyword] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [userTags, setUserTags] = useState<string[]>([]);
    const [tagOptions, setTagOptions] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isComingSoon, setIsComingSoon] = useState<boolean>(true); 

    useEffect(() => {
        const fetchTagOptions = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_tags`,{
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    }
                });
                setTagOptions(response.data.map((tag: { name: string }) => tag.name));
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchTagOptions();
        const fetchUserTags = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_user_tags/${currentUserId}`,{
                    headers: { 'Authorization': `Bearer ${userDetails.token}`, 
                    "Content-Type": "application/json",   
                    }
                 });
                setUserTags(response.data.map((tag: { name: string }) => tag.name));
            } catch (error) {
                console.error('Error fetching user tags:', error);
            }
        };
        fetchUserTags();
    }, []);
    
    return <>
        <Box
            display="flex"
            alignItems="right" 
            justifyContent="right"
            padding={2}
            gap={2}
        >
            {userDetails.isAdmin ?
                <Link to="/admin">
                    <Button variant="contained">
                        <FlagIcon/>
                    </Button>
                </Link> :
                <></>
            }
            <Link to={`/profile/${currentUserId}`}>
                <Button variant="contained">
                    <PersonIcon/>
                </Button>
            </Link>
            
        </Box>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center" 
            justifyContent="center"
            gap={2}
        >
            {/* <h3 className="card-title">Welcome {userDetails.firstName}!</h3> */}
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
                    <TextField 
                        {...params} 
                        label="Tags" 
                        type="text" 
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <div style={{ display: 'none' }}>
                                    {params.InputProps.endAdornment}
                                </div>
                            ),
                        }}
                    />
                )}
                sx={{ width: '255px' }}
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                onChange={(_, newValue) => {
                    setTags(newValue);
                }}
                open={inputValue !== ''}
            />
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
            <EventList searchKeyword={searchKeyword} tags={tags} userTags={userTags} isComingSoon={isComingSoon}/>         
            <BottomNavBar userId={currentUserId!}/>
        </Box>
    </>;
};

function EventList({searchKeyword, tags, userTags, isComingSoon}: {searchKeyword: string, tags: string[], userTags: string[], isComingSoon: boolean}) {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);
    const {userDetails} = useUser()
    console.log("event list userDetails", userDetails);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`${BASE_URL}/get_events/${userDetails.email}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                }
            });
            const res: EventSyncEvent[] = response.data;
            const sortedEvents = res.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
            setEvents(sortedEvents);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        setEventsChanged(false);
        fetchData();
    }, [eventsChanged]);

    const navigate = useNavigate();

    async function viewEvent (event: EventSyncEvent) {
        console.log(event);
        try {
            await axios.post(`${BASE_URL}/addOneView/${event.id}/`, {userId: userDetails.email}, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                }
            });
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

    const sortedFilteredEvents = filteredEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const eventRecommended = filteredEvents
        .filter(event => event.tags && event.tags.some(tag => userTags.includes(tag.name)))
        .sort((a, b) => {
            const aTagMatches = a.tags ? a.tags.filter(tag => userTags.includes(tag.name)).length : 0;
            const bTagMatches = b.tags ? b.tags.filter(tag => userTags.includes(tag.name)).length : 0;
            return bTagMatches - aTagMatches;
    });

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '50vh', overflow: 'auto'}}
        padding={2}
    >
        {isComingSoon ? sortedFilteredEvents.map(event =>
            <StyledCard key={event.id} event={event} viewEvent={viewEvent} showTags/>
        ) : eventRecommended.map(event =>
            <StyledCard key={event.id} event={event} viewEvent={viewEvent} showTags/>
        )}
    </Grid2>;
};

export default HomePage;
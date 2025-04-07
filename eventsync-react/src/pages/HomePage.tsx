import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import axios from "axios";
import { Button, Grid2, InputAdornment, TextField, Autocomplete, Checkbox, FormControlLabel, Collapse, Typography, IconButton, Card } from '@mui/material';
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
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';
import { Dayjs } from 'dayjs';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ReplayIcon from '@mui/icons-material/Replay';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';

function HomePage() {
    const { userDetails } = useUser();
    if (!userDetails || !userDetails.email) {
        return <div className="loading-container">
            <img src={logo} alt="EventSync Logo" className="logo" />
            <Typography className="loading-text">Loading...</Typography>
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
    const [afterDate, setAfterDate] = useState<Dayjs | null>(null);
    const [beforeDate, setBeforeDate] = useState<Dayjs | null>(null);
    const [hideFullEvents, setHideFullEvents] = useState<boolean>(false);
    const [filtersVisible, setFiltersVisible] = useState<boolean>(false);
    const [friends, setFriends] = useState<string[]>([]);

    const resetBeforePicker = () => {
        setBeforeDate(null);
    }

    const resetAfterPicker = () => {
        setAfterDate(null);
    }

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
                    headers: { 
                        'Authorization': `Bearer ${userDetails.token}`, 
                        "Content-Type": "application/json",   
                    }
                 });
                setUserTags(response.data.map((tag: { name: string }) => tag.name));
            } catch (error) {
                console.error('Error fetching user tags:', error);
            }
        };
        fetchUserTags();

        const fetchFriends = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_friends/${currentUserId}`, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    }
                });
                setFriends(response.data.map((friend: { id: string }) => friend.id));
            } catch (error) {
                console.error('Error fetching friends:', error);
            }
        };
        fetchFriends();
    }, []);
    
    return <>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box style={{ position: 'fixed', top: '0', backgroundColor: "#1c284c", width: "100%", right: 0, left: 0, marginRight: "0", marginLeft: "auto"}}>
                <Box
                    display="flex"
                    justifyContent="space-between"
                    alignContent="center"
                    padding={1}
                >
                    <Card 
                        component="img"
                        sx={{
                            height: 60,
                            width: 60,
                            backgroundColor: "white",
                            
                        }}
                        src={logo}
                        square={false}
                    />
                    <Box display="flex" alignItems="center" gap={3}>
                        {userDetails.isAdmin ?
                            <Link to="/admin">
                                <Button variant="contained">
                                    <FlagIcon style={{ color: 'black'}}/>
                                </Button>
                            </Link> :
                        <></>
                        }
                        <Link to={`/profile/${currentUserId}`}>
                            <Button variant="contained">
                                <PersonIcon style={{ color: 'black'}}/>
                            </Button>
                        </Link>
                    </Box>
                </Box>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center" 
                    justifyContent="center"
                    gap={2}
                    sx={{height: "80px"}}
                >
                    {/* <Typography variant="h5">Welcome {userDetails.firstName}!</Typography> */}
                    <Box>
                        <TextField 
                            sx={{backgroundColor: 'white'}}
                            id="outlined-basic" 
                            value={searchKeyword}
                            onChange={(e) => {
                                const val = e.target.value
                                if(val.length <= 40){
                                    setSearchKeyword(e.target.value)
                                }
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon style={{ color: '#1c284c'}}/>
                                    </InputAdornment>
                                    ),
                                },
                            }}
                            variant="outlined"
                        />
                        <IconButton sx={{paddingRight: 0, paddingLeft: "auto"}} onClick={() => setFiltersVisible(!filtersVisible)}>
                            <FilterListIcon fontSize="large" style={{ color: '#71A9F7'}} />
                        </IconButton>
                    </Box>
                    {/* <Button sx={{height: "8px"}} onClick={() => setFiltersVisible(!filtersVisible)}>
                        {filtersVisible ? "Close Filters" : "Open Filters"}
                        {filtersVisible ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Button> */}
                    <Box sx={{width: "95%", position: 'fixed', top: '150px', "z-index": 10, border: filtersVisible ? 2 : undefined, borderColor: "#1c284c" }}>
                        <Collapse in={filtersVisible} sx={{width: "100%"}} >
                            <Box 
                                sx={{backgroundColor: 'white'}}
                                display="flex"
                                flexDirection="column"
                                justifyContent="center"
                                alignItems="center"
                            >
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
                                <Box display="flex" alignItems="center" width={"255px"}>
                                    <MobileDateTimePicker
                                        label="After"
                                        value={afterDate}
                                        onChange={(newValue) => setAfterDate(newValue)}
                                        minDateTime={dayjs()}
                                        maxDateTime={beforeDate || undefined}
                                    />
                                    <Button onClick={resetAfterPicker}>
                                        <ReplayIcon sx={{color: "#1c284c"}}/>
                                    </Button>
                                </Box>
                                <Box display="flex" alignItems="center" width={"255px"}>
                                    <MobileDateTimePicker
                                        label="Before"
                                        value={beforeDate}
                                        onChange={(newValue) => setBeforeDate(newValue)}
                                        minDateTime={afterDate || dayjs()}
                                    />
                                    <Button onClick={resetBeforePicker}>
                                        <ReplayIcon sx={{color: "#1c284c"}}/>
                                    </Button>
                                </Box>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={hideFullEvents}
                                            onChange={(e) => setHideFullEvents(e.target.checked)}
                                            name="hideFullEvents"
                                            style={{color:"#1c284c"}}
                                        />
                                    }
                                    label="Hide Full Events"
                                />
                            </Box>
                        </Collapse>
                    </Box>
                </Box>
                <Box
                    display="flex"
                    flexDirection="row"
                    alignItems="center" 
                    justifyContent="center"
                    padding={1}
                >
                <Button 
                        variant={isComingSoon ? "contained": "outlined"} 
                        sx={{
                            color: isComingSoon
                               ? 'black'
                               : 'white',
                          }}
                        fullWidth
                        onClick={() => {setIsComingSoon(true)}}
                    >
                        Coming Soon
                    </Button>
                    <Button 
                        variant={!isComingSoon ? "contained" : "outlined"} 
                        sx={{
                            color: !isComingSoon
                               ? 'black'
                               : 'white',
                          }}
                        fullWidth
                        onClick={() => {setIsComingSoon(false)}}
                    >
                        Recommended
                    </Button> 
                </Box> 
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center" 
                justifyContent="center"
                gap={2}
                sx={{paddingTop: "200px"}}
            >
                <EventList searchKeyword={searchKeyword} tags={tags} userTags={userTags} isComingSoon={isComingSoon} hideFullEvents={hideFullEvents} afterDate={afterDate} beforeDate={beforeDate} friends={friends}/>   
                <BottomNavBar userId={currentUserId!}/>
            </Box>
        </LocalizationProvider>
    </>;
};

function EventList({searchKeyword, tags, userTags, isComingSoon, hideFullEvents, afterDate, beforeDate, friends}: {searchKeyword: string, tags: string[], userTags: string[], isComingSoon: boolean, hideFullEvents: boolean, afterDate: Dayjs | null, beforeDate: Dayjs | null, friends: string[]}) {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [eventsPerPage] = useState(10);
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

    useEffect(() => {
        setCurrentPage(1);
        window.scrollTo(0, 0);
    }, [searchKeyword, tags, isComingSoon, hideFullEvents, afterDate, beforeDate, friends]);

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
            ? event.eventName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
              (event.description && event.description.toLowerCase().includes(searchKeyword.toLowerCase()))
            : true;
        const matchesTags = tags.length > 0
            ? tags.every(tag => event.tags && event.tags.map(t => t.name).includes(tag))
            : true;
        const notFull = hideFullEvents
            ? event.RSVPLimit === 0 || event.numRsvps < event.RSVPLimit
            : true;
        const selectedAfter = new Date(event.startTime).getTime() > (afterDate ? afterDate.toDate().getTime() : dayjs().subtract(1, 'day').toDate().getTime());
        const selectedBefore = beforeDate
            ? new Date(event.startTime).getTime() < beforeDate.toDate().getTime()
            : true;
        const isVisible = event.isPublic || friends.includes(event.creatorId);

        return matchesKeyword && matchesTags && notFull && selectedAfter && selectedBefore && isVisible;
    });
    
    const sortedFilteredEvents = filteredEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    const eventRecommended = filteredEvents
        .filter(event => event.tags && event.tags.some(tag => userTags.includes(tag.name)))
        .sort((a, b) => {
            const aTagMatches = a.tags ? a.tags.filter(tag => userTags.includes(tag.name)).length : 0;
            const bTagMatches = b.tags ? b.tags.filter(tag => userTags.includes(tag.name)).length : 0;
            return bTagMatches - aTagMatches;
        });

    const indexOfLastEvent = currentPage * eventsPerPage;
    const currentEvents = isComingSoon ? sortedFilteredEvents.slice(0, indexOfLastEvent) : eventRecommended.slice(0, indexOfLastEvent);

    const handlePageChange = () => {
        setCurrentPage(prevPage => prevPage + 1);
    };

    return (
        <>
            <Grid2
                container spacing={3}
                display="flex"
                alignItems="center" 
                justifyContent="center"
                paddingBottom={2}
            >
                { currentEvents.length === 0 ?
                    !isComingSoon ?
                        <Typography paddingTop={3} color="white">Select interests to see recommended events</Typography>
                        :
                        <></>
                    :
                    currentEvents.map((event) => (
                        <StyledCard key={event.id} event={event} viewEvent={viewEvent} showTags/>
                    ))
                }
            </Grid2>
            {currentEvents.length < (isComingSoon ? sortedFilteredEvents.length : eventRecommended.length) && currentEvents.length !== 0 && (
                <Button onClick={handlePageChange} variant="contained" sx={{ marginTop: 0, marginBottom: 10, backgroundColor: "#71A9F7", color: "black" }}>
                    Load More
                </Button>
            )}
        </>
    );
};

export default HomePage;
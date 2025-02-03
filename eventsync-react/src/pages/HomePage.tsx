import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import axios from "axios";
import { Button, Grid2, InputAdornment, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import Card from '@mui/material/Card';
import BottomNavBar from '../components/BottomNavBar';
import DeleteRecurEventModal from '../components/DeleteRecurEventModal';
import TagModal, { Tag } from '../components/TagModal';
import { Link } from 'react-router-dom';
import SignOutButton  from '../components/SignOutButton';
import { useUser } from '../sso/UserContext';
import "../styles/style.css"
import StyledCard from '../StyledCard';

function HomePage() {
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;
    const [searchKeyword, setSearchKeyword] = useState('');
    // console.log("home page: ")
    // console.log(currentUserId);
    
    const [isComingSoon, setIsComingSoon] = useState<Boolean>(true); 
    return <>
        <Box
            display="flex"
            alignItems="right" 
            justifyContent="right"
            padding={2}
            gap={2}
        >
            <SignOutButton />
            
            <Link to="/profilePage">
                <Button variant="contained">
                    <PersonIcon/>
                </Button>
            </Link>
        </Box>
        {/* <Box
            display="flex"
            alignItems="center" 
            justifyContent="center"
        >
            <h3 className="card-title">Welcome {userDetails.firstName}!</h3>
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
        // uncomment for Sprint 2
        */ }
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
            <EventList searchKeyword={searchKeyword}/>
            <BottomNavBar></BottomNavBar>
        </Box>
    </>;
};

function EventList({searchKeyword}: {searchKeyword: string}) {
    const [events, setEvents] = useState<EventSyncEvent[]>([]);    
    const [eventsChanged, setEventsChanged] = useState<Boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get('http://localhost:5000/get_events');
            const res: EventSyncEvent[] = response.data;
            setEvents(res);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        setEventsChanged(false);
        fetchData();
    }, [eventsChanged]);

    async function deleteEvent (event: EventSyncEvent) {
        console.log(event);
        try {
            const response = await axios.delete(`http://localhost:5000/delete_one_event/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        try {
            const response = await axios.get(`http://localhost:5000/get_events`);
            const res: EventSyncEvent[] = response.data;
            setEvents(res);
            } catch (error) {
            console.error('Error fetching data:', error);
            }
    }

    function handleDeleteButton(event: EventSyncEvent){
        if(!event.recurs){
            deleteEvent(event)
        } else {

        }
    }

    const navigate = useNavigate();

    async function viewEvent (event: EventSyncEvent) {
        console.log(event);
        try {
            const response = await axios.post(`http://localhost:5000/addOneView/${event.id}/`);
            console.log(response);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        navigate(`/viewEvent/${event.id}`);
    }

    const filteredEvents = searchKeyword
        ? events.filter(event =>
            event.eventName.toLowerCase().includes(searchKeyword.toLowerCase())
        )
        : events;

    return <Grid2
        container spacing={3}
        display="flex"
        alignItems="center" 
        justifyContent="center"
        style={{maxHeight: '65vh', overflow: 'auto'}}
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
                <StyledCard key={event.id} event={event} viewEvent={viewEvent} showTags>
                    {/* <Button variant="contained" onClick={() => viewEvent(event)}>View Event</Button>
                    <Button variant="contained" onClick={() => deleteEvent(event)}>Delete Event</Button> */}
                    {/* <DeleteRecurEventModal event={event} setEventsChanged={setEventsChanged}> */}
                    {/* </DeleteRecurEventModal> */}
                </StyledCard>
            // </Box>
        )}
    </Grid2>;
};


export type EventSyncEvent = {
    eventName : string;
    // attendees : Number; TODO
    startTime: string;
    endTime: string;
    views: number;
    id: number;
    recurs: Boolean;
    tags: Tag[];
}

export default HomePage;
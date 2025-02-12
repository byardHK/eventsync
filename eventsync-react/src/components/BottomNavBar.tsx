import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import HomeIcon from '@mui/icons-material/Home';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatIcon from '@mui/icons-material/Chat';
import GroupIcon from '@mui/icons-material/Group';

function BottomNavBar(){
    return<Box
        display="flex"
        flexDirection="row"
        width="100%"
        paddingBottom={2}
        paddingTop={2}
        justifyContent="space-around"
        style={{ position: 'fixed', bottom: '0' }}
    >
        <Link to="/">
            <Button variant="contained">
                <HomeIcon/>
            </Button>
        </Link>
        <Link to="/myEventsPage">
            <Button variant="contained">
                <CalendarMonthIcon/>
            </Button>
        </Link>
        <Link to="/friendsPage">
            <Button variant="contained">
                <ChatIcon/>
            </Button>
        </Link> */}
        <Link to="/friendsPage">
            <Button variant="contained">
                <GroupIcon/>
            </Button>
        </Link>  
    </Box>
}

export default BottomNavBar;
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
        gap={2}
        padding={3}
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
        {/* <Link to="/friendsPage">
            <Button variant="contained">
                <ChatIcon/>
            </Button>
        </Link>
        <Link to="/friendsPage">
            <Button variant="contained">
                <GroupIcon/>
            </Button>
        </Link>  
        // uncomment for Sprint 2
        */}
    </Box>
}

export default BottomNavBar;
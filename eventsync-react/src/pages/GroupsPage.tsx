import { Box, Button, ButtonGroup, Card, ClickAwayListener, Grow, IconButton, MenuItem, MenuList, Paper, Popper } from "@mui/material"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "../components/BottomNavBar";
import { Collapsible } from '@base-ui-components/react/collapsible';
import React from "react";
import { ArrowDropDownIcon } from "@mui/x-date-pickers/icons";
import ChatIcon from '@mui/icons-material/Chat';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import axios from "axios";
import { useUser } from "../sso/UserContext";
import User from "../types/User";

type Group = {
    id: number;
    groupName: string;
    creatorId: number;
}

function loadGroupUsers({id} : Group){
    const [usersInGroup, setUsersInGroup] = useState<User[]>([]);
    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/get_users_in_group/${id}`);
            setUsersInGroup(response.data);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);
}

function GroupsPage(){
    const [groups, setGroups] = useState<Group[]>([]);
    const [isFriendsPage, setIsFriendsPage] = useState<Boolean>(false);  
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/get_my_groups/${currentUserId}`);
            setGroups(response.data);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);


    const navigate = useNavigate();

    function toggleFriendsGroupPages(isFriendsPage: boolean){
        if(isFriendsPage){
            navigate('/friendsPage');
        }
    }

    return(
        <>
            <Box display="flex" flexDirection="row">
                <Button 
                    variant={isFriendsPage ? "contained" : "outlined"} 
                    fullWidth
                    onClick={() => {toggleFriendsGroupPages(true)}}
                >
                    Friends
                </Button>
                <Button 
                    variant={!isFriendsPage ? "contained" : "outlined"} 
                    fullWidth
                    onClick={() => {toggleFriendsGroupPages(false)}}
                >
                    Groups
                </Button>
            </Box>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
            >
                {groups.map(group =>
                    <SplitButton group={group} key={group.id}/>
                )}
            </Box>
            <BottomNavBar></BottomNavBar>
        </>
    );
}   

type SplitButtonProps = {
    group: Group;
};

function SplitButton({group}: SplitButtonProps) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(1);
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/get_users_in_group/${group.id}`);
                setUsers(response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
    ) => {
        setSelectedIndex(index);
        setOpen(false);
    };

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
    if (
        anchorRef.current &&
        anchorRef.current.contains(event.target as HTMLElement)
    ) {
        return;
    }

    setOpen(false);
    };

    const navigate = useNavigate();

    return (
    <React.Fragment>
        <ButtonGroup
            variant="contained"
            ref={anchorRef}
            aria-label="Button group with a nested menu"
        >
        <Card sx={{padding: 3}}>
            <h2>{group.groupName}</h2>
            <Box display="flex" flexDirection="row">
                {/* TODO: Make navigate to right things */}
                <IconButton onClick={()=>navigate('/friendsPage')}>
                    <FlagIcon style={{color: "red"}}></FlagIcon>
                </IconButton>
                <IconButton onClick={()=>navigate('/friendsPage')}>
                    <ChatIcon style={{color: "blue"}}></ChatIcon>
                </IconButton>
                <IconButton onClick={()=>navigate('/friendsPage')}>
                    <EditIcon style={{color: "blue"}}></EditIcon>
                </IconButton>
            </Box>
        </Card>
        <Button
            size="small"
            aria-controls={open ? 'split-button-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-label="select merge strategy"
            aria-haspopup="menu"
            sx={{backgroundColor: "white"}}
            onClick={handleToggle}
        >
            <ArrowDropDownIcon sx={{color: "blue"}}/>
        </Button>
        </ButtonGroup>
        <Popper
            sx={{ zIndex: 1 }}
            open={open}
            anchorEl={anchorRef.current}
            role={undefined}
            transition
            disablePortal
        >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {users.map((user, index) => (
                    <MenuItem
                      key={user.id}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {user.id}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </React.Fragment>
  );
}


export default GroupsPage
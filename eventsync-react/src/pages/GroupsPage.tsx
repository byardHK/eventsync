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
import AddIcon from '@mui/icons-material/Add';
import GroupModal from "../components/GroupModal";
import ReportModal from "../components/ReportModal";
import { BASE_URL } from "../components/Cosntants";

export type Group = {
    id: number;
    groupName: string;
    creatorId: number;
    users: User[];
}

function GroupsPage(){
    const [groups, setGroups] = useState<Group[]>([]);
    const [isFriendsPage, setIsFriendsPage] = useState<Boolean>(false);  
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    async function reloadMyGroups() {
        try {
            const response = await axios.get(`${BASE_URL}/get_my_groups/${currentUserId}`);
            setGroups(response.data);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    useEffect(() => {
        reloadMyGroups();
    }, []);


    const navigate = useNavigate();

    function toggleFriendsGroupPages(isFriendsPage: boolean){
        if(isFriendsPage){
            navigate('/friendsPage');
        }
    }

    const [newGroupsModalOpen, setNewGroupsModalOpen] = useState<boolean>(false);

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
            <GroupModal open={newGroupsModalOpen} onClose={() => setNewGroupsModalOpen(false)} onSave={reloadMyGroups}/>
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
                paddingTop={3}
                sx={{height: "75vh"}}
            >
                {groups.map(group =>
                    <SplitButton group={group} key={group.id} onSave={reloadMyGroups}/>
                )}
            </Box>
            <Box
                display="flex"
                flexDirection="row"
                width="100%"
                paddingBottom={2}
                paddingTop={2}
                justifyContent="flex-end"
                style={{ position: 'fixed', bottom: '40px' }}
            >
                <Box display="flex" justifyContent="flex-end" alignItems="flex-end">
                    <Button onClick={()=>setNewGroupsModalOpen(true)}>
                        <AddIcon></AddIcon>
                    </Button>
                </Box>
            </Box>
            <BottomNavBar userId={currentUserId!}/>
        </>
    );
}   

type SplitButtonProps = {
    group: Group;
    onSave: () => void;
};

function SplitButton({group, onSave}: SplitButtonProps) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(1);
    const [editing, setEditing] = useState<boolean>(false);

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
    const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
    return (
    <>
        <GroupModal groupId={group.id} open={editing} onClose={() => setEditing(false)} onSave={onSave}/>
        <ButtonGroup
            variant="contained"
            ref={anchorRef}
            aria-label="Button group with a nested menu"
        >
            <Card sx={{padding: 3}}>
                <h2>{group.groupName}</h2>
                <Box display="flex" flexDirection="row">
                    <ReportModal input={group} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="group"/>
                    <Box display="flex" alignItems="right" justifyContent="right">
                        <IconButton onClick={()=>setReportModalOpen(true)}>
                            <FlagIcon style={{ color: 'red'}}></FlagIcon>
                        </IconButton>
                    </Box>
                    <IconButton onClick={()=>navigate('/friendsPage')}>
                        <ChatIcon style={{color: "blue"}}></ChatIcon>
                    </IconButton>
                    <IconButton onClick={() => setEditing(true)}>
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
                  {group.users.map((user, index) => (
                    <MenuItem
                      key={user.id}
                    >
                      {`${user.fname} ${user.lname}`}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}


export default GroupsPage
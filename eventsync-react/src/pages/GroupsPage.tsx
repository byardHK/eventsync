import { Box, Button, ButtonGroup, Card, CircularProgress, ClickAwayListener, Dialog, Grid2, Grow, IconButton, MenuItem, MenuList, Paper, Popper, Typography } from "@mui/material"
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavBar from "../components/BottomNavBar";
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
import { BASE_URL } from "../components/Constants";
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';

export type Group = {
    id: number;
    groupName: string;
    creatorId: string;
    chatId: number;
    users: User[];
}

function GroupsPage(){
    const [groups, setGroups] = useState<Group[]>();
    const [isFriendsPage] = useState<Boolean>(false);  
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    async function reloadMyGroups() {
        try {
            const response = await axios.get(`${BASE_URL}/get_my_groups/${currentUserId}`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            setGroups(response.data);
            
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }

    useEffect(() => {
        reloadMyGroups();
    }, [currentUserId]);

    const navigate = useNavigate();

    function toggleFriendsGroupPages(isFriendsPage: boolean){
        if(isFriendsPage){
            navigate('/friends');
        }
    }

    const [newGroupsModalOpen, setNewGroupsModalOpen] = useState<boolean>(false);

    return<>
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
            justifyContent="center"
        >
            <GroupModal open={newGroupsModalOpen} onClose={() => setNewGroupsModalOpen(false)} onSave={reloadMyGroups}/>
            <Grid2
                container spacing={3}
                display="flex"
                alignItems="center" 
                justifyContent="center"
                style={{maxHeight: '84vh', overflow: 'auto'}}
                padding={2}
            >
                {groups ? 
                    groups.map(group =>
                        <SplitButton group={group} key={group.id} currentUserId={currentUserId!} onSave={reloadMyGroups}/>
                    ) :
                    <Box
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <Typography>Loading...</Typography>
                        <CircularProgress/>
                    </Box>
                }
            </Grid2>
            <Box
                display="flex"
                flexDirection="row"
                width="100%"
                paddingBottom={2}
                paddingTop={2}
                justifyContent="flex-end"
                style={{ position: 'fixed', bottom: '40px' }}
            >
                <Box display="flex" justifyContent="flex-end" alignItems="flex-end" sx={{width: "100%", position: 'fixed', bottom: '75px'}} paddingRight={3}>
                    <Button variant="contained" sx={{ minWidth: '50px', minHeight: '50px'}} onClick={()=>setNewGroupsModalOpen(true)}>
                        <AddIcon></AddIcon>
                    </Button>
                </Box>
            </Box>
            <BottomNavBar userId={currentUserId!}/>
        </Box>
    </>
}   

type SplitButtonProps = {
    group: Group;
    onSave: () => void;
    currentUserId: string;
};

function SplitButton({group, onSave, currentUserId}: SplitButtonProps) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [editing, setEditing] = useState<boolean>(false);
    const [leavingGroupModalOpen, setLeavingGroupModalOpen] = useState<boolean>(false); 
    const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState<boolean>(false); 

    function LeaveGroupModal(){
        return <Dialog
            onClose={()=> {setLeavingGroupModalOpen(false)}}
            open={leavingGroupModalOpen}
        >
            <Box sx={{padding : 3}}>
                <Typography variant="h5">Leave group?</Typography>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setLeavingGroupModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={leaveGroup}>Yes</Button>
                </Box>
            </Box>
        </Dialog>
    }

    async function leaveGroup(){
        try {
            await axios.post(`${BASE_URL}/remove_user_from_group`, {
                currentUserId: currentUserId,
                groupId: group.id
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setLeavingGroupModalOpen(false);
        onSave();
    }

    function DeleteGroupModal(){
        return <Dialog
            onClose={()=> {setDeleteGroupModalOpen(false)}}
            open={deleteGroupModalOpen}
        >
            <Box sx={{padding : 3}}>
                <Typography variant="h5">Delete group?</Typography>
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={()=> {setDeleteGroupModalOpen(false)}}>Cancel</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={deleteGroup}>Yes</Button>
                </Box>
            </Box>
        </Dialog>
    }

    async function deleteGroup(){
        try {
            await axios.post(`${BASE_URL}/delete_group`, {
                groupId: group.id
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        }
        setDeleteGroupModalOpen(false);
        onSave();
    }

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
        <LeaveGroupModal></LeaveGroupModal>
        <DeleteGroupModal></DeleteGroupModal>
        <GroupModal groupId={group.id} open={editing} onClose={() => setEditing(false)} onSave={onSave}/>
        <ButtonGroup
            variant="contained"
            ref={anchorRef}
            aria-label="Button group with a nested menu"
        >
            <Card sx={{padding: 3, maxWidth: "25vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}} >
                <Typography variant="h5">{group.groupName}</Typography>
                <Box display="flex" flexDirection="row">
                    <ReportModal input={group} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="group"/>
                    <IconButton onClick={()=>navigate(`/viewChat/${group.chatId}`)}>
                        <ChatIcon style={{color: "#04227a"}}></ChatIcon>
                    </IconButton>
                    <IconButton onClick={() => setEditing(true)}>
                        <EditIcon style={{color: "#04227a"}}></EditIcon>
                    </IconButton>
                    <Box display="flex" alignItems="right" justifyContent="right">
                        <IconButton onClick={()=>setReportModalOpen(true)}>
                            <FlagIcon style={{ color: '#ad1f39'}}></FlagIcon>
                        </IconButton>
                    </Box>
                    {true ? (
                        <IconButton onClick={() => setDeleteGroupModalOpen(true)}>
                            <DeleteIcon style={{color: "#ad1f39"}}></DeleteIcon>
                        </IconButton>
                    ) :
                    (
                        <IconButton onClick={() => setLeavingGroupModalOpen(true)}>
                            <LogoutIcon style={{color: "#ad1f39"}}></LogoutIcon>
                        </IconButton>
                    )}
                    {/* {currentUserId === group.creatorId ? ( */}
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
                  {group.users.map((user) => (
                    <MenuItem
                      key={user.id}
                      onClick={() => {navigate(`/profile/${user.id}`)}}
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
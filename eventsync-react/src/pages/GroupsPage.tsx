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
import GroupIcon from '@mui/icons-material/Group';

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
    <Box sx={{paddingBottom: "10px"}}>
        <Box display="flex" flexDirection="row">
            <Button 
                variant={isFriendsPage ? "contained" : "outlined"} 
                fullWidth
                onClick={() => {toggleFriendsGroupPages(true)}}
                sx={{
                    color: isFriendsPage
                       ? 'black'
                       : 'white'
                  }}
            >
                Friends
            </Button>
            <Button 
                variant={!isFriendsPage ? "contained" : "outlined"} 
                fullWidth
                onClick={() => {toggleFriendsGroupPages(false)}}
                sx={{
                    color: !isFriendsPage
                       ? 'black'
                       : 'white'
                  }}
            >
                Groups
            </Button>
        </Box>
            {isFriendsPage ?
                <></>:
                <>
                    <Button sx={{color: "black", width:"100%", marginTop: "15px"}} title="Add Event Button" variant="contained" onClick={()=>setNewGroupsModalOpen(true)}>
                        <AddIcon sx={{color: "black", paddingRight: 1}}/>
                        Add Group
                    </Button>
                </>
            }
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
                style={{maxHeight: '82vh', overflow: 'auto'}}
                paddingBottom={8}
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
                        <Typography color="white">Loading Groups</Typography>
                    </Box>
                }
            </Grid2>
            {/* <Box
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
            </Box> */}
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
    const [viewGroupMembersModalOpen, setViewGroupMembersModalOpen] = useState<boolean>(false);
    const { userDetails } = useUser();

    function LeaveGroupModal(){
        return <Dialog
        onClose={()=> {setLeavingGroupModalOpen(false)}}
        open={leavingGroupModalOpen}
    >
        <Box sx={{padding: 3}} gap={2} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
            <Typography variant="h5">Leave group?</Typography>
            <Box sx={{padding:3}} display="flex" flexDirection="row" gap={3}>
                <Button variant="contained" fullWidth sx={{backgroundColor: "#1c284c", marginTop: "auto"}} onClick={()=> {setLeavingGroupModalOpen(false)}}>Cancel</Button>
                <Button variant="contained" fullWidth sx={{backgroundColor: "#1c284c", marginTop: "auto"}} onClick={leaveGroup}>Yes</Button>
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
            <Box sx={{padding: 3}} gap={2} display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                <Typography variant="h5">Delete group?</Typography>
                <Box sx={{padding:3}} display="flex" flexDirection="row" gap={3}>
                    <Button variant="contained" fullWidth sx={{backgroundColor: "#1c284c", marginTop: "auto"}} onClick={()=> {setDeleteGroupModalOpen(false)}}>Cancel</Button>
                    <Button variant="contained" fullWidth sx={{backgroundColor: "#1c284c", marginTop: "auto"}} onClick={deleteGroup}>Yes</Button>
                </Box>
            </Box>
        </Dialog>
    }
    function ViewMembersModal(){
        return <Dialog
            onClose={()=> {setViewGroupMembersModalOpen(false)}}
            open={viewGroupMembersModalOpen}
        >
            <Box sx={{padding : 5}}>
                <Typography variant="h5" fontWeight="bold">Group Members</Typography>
                <br></br>
                {group.users.map((user) => (
                    // <MenuItem
                    //   key={user.id}
                    //   onClick={() => {navigate(`/profile/${user.id}`)}}
                    // >
                    //   {`${user.fname} ${user.lname}`}
                    // </MenuItem>
                    <Card
                        key={user.id}
                        sx={{
                            width: "200px", 
                            padding: "10px", 
                            backgroundColor: "#71A9F7", 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            margin: "5px 0"
                        }}
                        square={false}
                        onClick={() => {navigate(`/profile/${user.id}`)}}
                    >
                        <Box flexGrow={1} textAlign="left" marginLeft={5}>
                            {`${user.fname} ${user.lname}`}
                        </Box>
                    </Card>
                  ))}
                  <br></br>
                  <Button variant="contained" fullWidth sx={{marginTop: "auto", backgroundColor:"#1c284c"}} onClick={()=> {setViewGroupMembersModalOpen(false)}}>Close</Button>
            </Box>
        </Dialog>
    }

    async function deleteGroup(){
        try {
            await axios.post(`${BASE_URL}/delete_group`, {
                groupId: group.id,
                creatorId: group.creatorId
            },{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
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
        <ViewMembersModal></ViewMembersModal>
        <GroupModal groupId={group.id} open={editing} onClose={() => setEditing(false)} onSave={onSave}/>
        <ButtonGroup
            variant="contained"
            ref={anchorRef}
            aria-label="Button group with a nested menu"
        >
            <Card sx={{padding: 4, maxWidth: "35vh", minWidth: "35vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center"}} >
                <Typography variant="h5" fontWeight="bold">{group.groupName}</Typography>
                <Box display="flex" flexDirection="row" gap={2}>
                    <ReportModal input={group} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="group"/>
                    <Box paddingTop={4} display="flex" flexDirection="row" gap={2}>
                        {currentUserId === group.creatorId ? (
                            <IconButton onClick={() => setDeleteGroupModalOpen(true)}>
                                <DeleteIcon style={{color: "#ad1f39"}}></DeleteIcon>
                            </IconButton>
                        ) :
                        (
                            <IconButton onClick={() => setLeavingGroupModalOpen(true)}>
                                <LogoutIcon style={{color: "#ad1f39"}}></LogoutIcon>
                            </IconButton>
                        )}
                        <IconButton onClick={()=>setReportModalOpen(true)}>
                            <FlagIcon style={{ color: '#ad1f39'}}></FlagIcon>
                        </IconButton>
                        <IconButton onClick={() => setEditing(true)}>
                            <EditIcon style={{color: "#1c284c"}}></EditIcon>
                        </IconButton>
                        <IconButton onClick={()=>navigate(`/viewChat/${group.chatId}`)}>
                            <ChatIcon style={{color: "#1c284c"}}></ChatIcon>
                        </IconButton>
                        <IconButton onClick={()=>setViewGroupMembersModalOpen(true)}>
                            <GroupIcon style={{color: "#1c284c"}}></GroupIcon>
                        </IconButton>
                    </Box>
                    {/* {currentUserId === group.creatorId ? ( */}
                </Box>
            </Card>
            {/* <Button
                size="small"
                aria-controls={open ? 'split-button-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-label="select merge strategy"
                aria-haspopup="menu"
                sx={{backgroundColor: "white"}}
                onClick={handleToggle}
            >
                <ArrowDropDownIcon sx={{color: "blue"}}/>
            </Button> */}
        </ButtonGroup>
        {/* <Popper
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
      </Popper> */}
    </>
  );
}


export default GroupsPage
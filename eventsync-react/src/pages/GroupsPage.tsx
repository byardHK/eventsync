import { Box, Button, ButtonGroup, Card, ClickAwayListener, Dialog, Grow, IconButton, MenuItem, MenuList, Paper, Popper } from "@mui/material"
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
    users: User[];
}

function GroupsPage(){
    const [groups, setGroups] = useState<Group[]>([]);
    const [isFriendsPage] = useState<Boolean>(false);  
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
    }, [currentUserId]);

    const navigate = useNavigate();

    function toggleFriendsGroupPages(isFriendsPage: boolean){
        if(isFriendsPage){
            navigate('/friends');
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
                    <SplitButton group={group} key={group.id} currentUserId={currentUserId!} onSave={reloadMyGroups}/>
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
    currentUserId: string;
};

function SplitButton({group, onSave, currentUserId}: SplitButtonProps) {
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = React.useState(1);
    const [editing, setEditing] = useState<boolean>(false);
    const [leavingGroupModalOpen, setLeavingGroupModalOpen] = useState<boolean>(false); 
    const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState<boolean>(false); 

    function LeaveGroupModal(){
        return <Dialog
            onClose={()=> {setLeavingGroupModalOpen(false)}}
            open={leavingGroupModalOpen}
        >
            <Box sx={{padding : 3}}>
                <h2>Leave group?</h2>
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
                <h2>Delete group?</h2>
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
            <Card sx={{padding: 3}}>
                <h2>{group.groupName}</h2>
                <Box display="flex" flexDirection="row">
                    <ReportModal input={group} open={reportModalOpen} onClose={() => setReportModalOpen(false)} type="group"/>
                    <Box display="flex" alignItems="right" justifyContent="right">
                        <IconButton onClick={()=>setReportModalOpen(true)}>
                            <FlagIcon style={{ color: 'red'}}></FlagIcon>
                        </IconButton>
                    </Box>
                    <IconButton onClick={()=>navigate('/friends')}>
                        <ChatIcon style={{color: "blue"}}></ChatIcon>
                    </IconButton>
                    <IconButton onClick={() => setEditing(true)}>
                        <EditIcon style={{color: "blue"}}></EditIcon>
                    </IconButton>
                    {currentUserId === group.creatorId ? (
                        <IconButton onClick={() => setDeleteGroupModalOpen(true)}>
                            <DeleteIcon style={{color: "red"}}></DeleteIcon>
                        </IconButton>
                    ) :
                    (
                        <IconButton onClick={() => setLeavingGroupModalOpen(true)}>
                            <LogoutIcon style={{color: "red"}}></LogoutIcon>
                        </IconButton>
                    )}
                    
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
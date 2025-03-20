import { Box, Button, Checkbox, Dialog, FormControlLabel, InputAdornment, TextField, Typography } from "@mui/material";
import { Group } from "../pages/GroupsPage";
import { useEffect, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import User from "../types/User";
import axios from "axios";
import { useUser } from "../sso/UserContext";
import { BASE_URL } from "./Constants";

type GroupModalProps = {
    groupId?: number;
    open: boolean;
    onClose: () => void;
    onSave: () => void;
};

function GroupModal({groupId, open, onClose, onSave}: GroupModalProps) {
    const [searchKeyword, setSearchKeyword] = useState<string>("");
    const [friends, setFriends] = useState<User[]>([]);
    const { userDetails } = useUser();
    
    const [group, setGroup] = useState<Group>({
        groupName: "Your Group",
        users: [] as User[]
    } as Group);

    async function reloadGroup() {
        if(!groupId) { return; }

        try {
            const response = await axios.get(`${BASE_URL}/get_group/${groupId}`, {
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            setGroup(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
    useEffect(() => { reloadGroup(); }, [groupId, open]);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const friendsReponse = await axios.get(`${BASE_URL}/get_friends/${userDetails.email}`,{
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            setFriends(friendsReponse.data);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, [userDetails.email]);

    async function handleSave() {
        if(groupId) {
            // Do edit group route (uses groupId, groupName, creatorId, & users)
            try {
                await fetch(`${BASE_URL}/edit_group`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(group),
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }

        } else {
            //Do new group route (uses only groupName, creatorId & users)
            try {
                await fetch(`${BASE_URL}/create_group`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({...group, creatorId: userDetails.email}),
                });
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        }
        onSave();
        onClose();
    }

    return <>
        <Dialog 
            onClose={onClose}
            open={open}
        >
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                gap={2}
                sx={{padding: 3, minHeight: "80vh", maxHeight: "80vh"}}
            >
                <TextField 
                    id="standard-basic" 
                    label="Group Name" 
                    variant="outlined" 
                    value={group.groupName}
                    onChange={(event) => {
                        setGroup({...group, groupName: event.target.value})
                    }}
                />
                <Typography>Choose friends to add to group: </Typography>
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
                {friends.filter((friend) => friend.id.toLowerCase().includes(searchKeyword.toLowerCase())).map((friend) =>
                    <Box key={friend.id}>
                        <FormControlLabel control={<Checkbox disabled={friend.id === userDetails.email} checked={!!group.users.find((user) => { return user.id === friend.id; })} onChange={(event) => {
                            const updatedGroup : Group = {...group};
                            if(event.target.checked){
                                updatedGroup.users.push(friend);
                            }else{
                                updatedGroup.users = updatedGroup.users.filter((user) => { return user.id !== friend.id; });
                            }
                            setGroup(updatedGroup);
                        }}/>} label={`${friend.fname} ${friend.lname}`} />
                    </Box>
                )}
                <Box display="flex" flexDirection="row" gap={2} sx={{"margin-top": "auto", width:"100%"}}>
                    <Button variant="contained" fullWidth onClick={onClose}>Cancel</Button>
                    <Button variant="contained" fullWidth onClick={handleSave}>Save</Button>
                </Box>
            </Box>
        </Dialog>
    </>
}

export default GroupModal;
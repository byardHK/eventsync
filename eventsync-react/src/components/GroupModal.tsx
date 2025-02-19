import { Box, Button, Checkbox, Dialog, FormControlLabel, InputAdornment, TextField } from "@mui/material";
import { Group } from "../pages/GroupsPage";
import { useEffect, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import User from "../types/User";
import axios from "axios";
import { useUser } from "../sso/UserContext";

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
            const response = await axios.get(`http://localhost:5000/get_group/${groupId}`);
            setGroup(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    }
    useEffect(() => { reloadGroup(); }, [groupId, open]);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const friendsReponse = await axios.get(`http://localhost:5000/get_friends/${userDetails.email}`);
            setFriends(friendsReponse.data);
            const loggedInUserResponse = await axios.get(`http://localhost:5000/get_user/${userDetails.email}`);
            setFriends([...friends, loggedInUserResponse.data]);
            if(!groupId) {
                if(group.users.findIndex(user => user.id === userDetails.email) === -1) {
                    const updatedGroup : Group = {...group};
                    updatedGroup.users.push({ id: userDetails.email! });
                    setGroup({...group})
                }
            }
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, [userDetails.email]);

    async function handleSave() {
        if(groupId) {
            //Do edit group route (uses groupId, groupName, creatorId, & users)
            try {
                await fetch(`http://localhost:5000/edit_group`, {
                    method: 'POST',
                    headers: {
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
                await fetch(`http://localhost:5000/create_group`, {
                    method: 'POST',
                    headers: {
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
                <p>Choose friends to add to group: </p>
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
                {/* {friends.filter((friend) => friend.id.toLowerCase().includes(searchKeyword.toLowerCase())).map((friend) =>
                    <Box>
                        <FormControlLabel control={<Checkbox disabled={friend.id === userDetails.email} checked={!!group.users.find((user) => { return user.id === friend.id; })} onChange={(event) => {
                            const updatedGroup : Group = {...group};
                            if(event.target.checked){
                                updatedGroup.users.push(friend);
                            }else{
                                updatedGroup.users = updatedGroup.users.filter((user) => { return user.id !== friend.id; });
                            }
                            setGroup(updatedGroup);
                        }}/>} label={friend.id} />
                    </Box>
                )} */}
                {friends.map(friend =>  
                    <Box>
                        <p></p>
                    </Box>
                )}
                <Box display="flex" flexDirection="row" justifyContent="space-betweem">
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={handleSave}>Save</Button>
                    <Button fullWidth sx={{marginTop: "auto"}} onClick={onClose}>Cancel</Button>
                </Box>
            </Box>
        </Dialog>
    </>
}

export default GroupModal;
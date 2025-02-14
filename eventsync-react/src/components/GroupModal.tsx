import { Box, Button, Checkbox, Dialog, FormControlLabel, InputAdornment, TextField } from "@mui/material";
import { Group } from "../pages/GroupsPage";
import { useEffect, useState } from "react";
import SearchIcon from '@mui/icons-material/Search';
import User from "../types/User";
import axios from "axios";
import { positions } from '@mui/system';

type GroupModalProps = {
    groupId?: number;
    open: boolean;
    onClose: () => void;
};

function GroupModal({groupId, open, onClose}: GroupModalProps) {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
    const [friends, setFriends] = useState<User[]>([]);
    const [group, setGroup] = useState<Group>({
        //Dummy group for new group creation
        groupName: "Your Group"
    } as Group);

    //State for groupName & users in group

    useEffect(() => {
        if(groupId) {
            //Make get request for group & its users with groupId
            //Set group / users to be what is returned
        }
    }, [groupId]);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`http://localhost:5000/get_users`);
            setFriends(response.data);
            
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    function handleSave() {
        if(groupId) {
            //Do edit group route (uses groupId, groupName, creatorId, & users)
        } else {
            //Do new group route (uses only groupName, creatorId & users)
        }
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
                <h1>{group.groupName}</h1>
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
                {friends.filter((friend) => friend.id.toLowerCase().includes(searchKeyword.toLowerCase())).map((friend, index) =>
                    <Box>
                        <FormControlLabel control={<Checkbox checked={!!selectedFriends.find((_friend) => { return _friend.id === friend.id; })}onChange={(event) => {
                            if(event.target.checked){
                                setSelectedFriends([...selectedFriends, friend])
                            }else{
                                setSelectedFriends(selectedFriends.filter((_tag) => { return _tag.id !== friend.id; }));
                            }
                        }}/>} label={friend.id} />
                    </Box>
                )}
                <Button sx={{marginTop: "auto"}} onClick={handleSave}>Save</Button>
            </Box>
        </Dialog>
    </>
}

export default GroupModal;
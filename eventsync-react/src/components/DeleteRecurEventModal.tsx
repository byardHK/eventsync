import { Box, Button, Dialog, FormControlLabel } from '@mui/material';
import { useState } from 'react';
import Radio from '@mui/material/Radio'; 
import RadioGroup from '@mui/material/RadioGroup'; 
import FormControl from '@mui/material/FormControl'; 
import EventSyncEvent from '../types/EventSyncEvent';
import { BASE_URL } from './Constants';

function DeleteRecurEventModal(props: { event: EventSyncEvent, setEventsChanged: React.Dispatch<React.SetStateAction<Boolean>> }){
    const [isOpen, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [numToDelete, setNumToDelete] = useState<String>("one");
    const {userDetails} = userUser();

    async function handleDelete(){
        console.log(`Delete ${props.event.id}, ${numToDelete}`);
        props.setEventsChanged(true);
        const deletePath = numToDelete == "one" ? `${BASE_URL}/delete_one_event/${props.event.id}/` : `${BASE_URL}/delete_multiple_events/${props.event.id}/`;
            const response = await fetch(deletePath, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${userDetails.token}`,
                    'Content-Type': 'application/json',
                },
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
                // setNumToDelete();
            }
        handleClose();
    }

    return <>
        <Button onClick={handleOpen}>Open Delete Recur Event modal</Button>
        <Dialog onClose={handleClose} open={isOpen}>
            <Box
                display="flex" 
                flexDirection="column"
                alignItems="center" 
                justifyContent="center"
            >
                <p>Are you sure you would like to cancel this event?</p>
                <Box
                    display="flex" 
                    flexDirection="row"
                >
                    <FormControl> 
                        <RadioGroup 
                            defaultValue={null}
                            onChange={(event) => setNumToDelete(event.target.value)}
                        > 
                            <FormControlLabel value="one" 
                                control={<Radio />} label="This event" /> 
                            <FormControlLabel value="all" 
                                control={<Radio />} label="This event and all following events" /> 
                        </RadioGroup> 
                    </FormControl> 
                </Box>
            </Box>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center" 
                justifyContent="center"
                padding={2}
                gap={2}
            >
                <Button variant="outlined" fullWidth onClick={handleClose}>No</Button>
                <Button variant="outlined" fullWidth onClick={handleDelete}>Yes</Button>
            </Box>
        </Dialog>
    </>
}

export default DeleteRecurEventModal

function userUser(): { userDetails: any; } {
    throw new Error('Function not implemented.');
}

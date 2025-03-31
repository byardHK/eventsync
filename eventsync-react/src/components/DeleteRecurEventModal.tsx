import { Box, Button, Dialog, FormControlLabel, Typography } from '@mui/material';
import { useState } from 'react';
import Radio from '@mui/material/Radio'; 
import RadioGroup from '@mui/material/RadioGroup'; 
import FormControl from '@mui/material/FormControl'; 
import EventSyncEvent from '../types/EventSyncEvent';
import { BASE_URL } from './Constants';
import { useUser } from '../sso/UserContext';

function DeleteRecurEventModal(props: { event: EventSyncEvent, setEventsChanged: React.Dispatch<React.SetStateAction<Boolean>> }){
    const [isOpen, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [numToDelete, setNumToDelete] = useState<String>("one");
    const {userDetails} = useUser();

    async function handleDelete(){
        console.log(`Delete ${props.event.id}, ${numToDelete}`);
        const deletePath = numToDelete == "one" ? `${BASE_URL}/delete_one_recurring_event/${props.event.id}/` : `${BASE_URL}/delete_multiple_events/${props.event.id}/`;
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
                console.log(`events should be reloading`);
            }
        handleClose();
                props.setEventsChanged(true);

    }

    return <>
        <Button sx={{backgroundColor: "#1c284c"}} fullWidth variant="contained" onClick={() => handleOpen()}>Delete</Button>
        <Dialog onClose={handleClose} open={isOpen}>
            <Box
                display="flex" 
                flexDirection="column"
                alignItems="center" 
                justifyContent="center"
                padding={2}
            >
                <Typography variant='h5'>Are you sure you would like to cancel this event?</Typography>
                <Box
                    display="flex" 
                    flexDirection="row"
                    padding={1}
                >
                    <FormControl> 
                        <RadioGroup 
                            defaultValue={null}
                            onChange={(event) => setNumToDelete(event.target.value)}
                            // style={{fontFamily: 'Times New Roman'}}
                        > 
                            <FormControlLabel value="one" /*style={{fontFamily: 'Times New Roman'}}*/
                                control={<Radio />} label={<Typography /*style={{ fontFamily: 'Times New Roman' }}*/>This event</Typography>} /> 
                            <FormControlLabel value="all" /*style={{fontFamily: 'Times New Roman'}}*/
                                control={<Radio />} label={<Typography /*style={{ fontFamily: 'Times New Roman' }}*/>This event and all other occurrences of this event</Typography>} /> 
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
                <Button variant="contained" fullWidth onClick={handleClose}>No</Button>
                <Button variant="contained" fullWidth onClick={handleDelete}>Yes</Button>
            </Box>
        </Dialog>
    </>
}

export default DeleteRecurEventModal

// function userUser(): { userDetails: any; } {
//     throw new Error('Function not implemented.');
// }

import { Box, Button, Checkbox, Chip, Dialog, FormControlLabel, Grid2, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import Radio from '@mui/material/Radio'; 
import RadioGroup from '@mui/material/RadioGroup'; 
import FormControl from '@mui/material/FormControl'; 

function DeleteRecurEventModal(){
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [toDelete, setToDelete] = useState<string | null>(null);

    async function handleDelete(){
        console.log(toDelete);
        // const deletePath = toDelete == "one" ? 'http://localhost:5000/delete_one_event/<int:eventId>/' : 'http://localhost:5000/delete_multiple_events/<int:eventId>/';
        //     const response = await fetch(deletePath, {
        //         method: 'DELETE',
        //         headers: {
        //             'Content-Type': 'application/json',
        //         },
        //     });
        //     if(response.ok){
        //         console.log('Data sent successfully:', response.json());
        //         setToDelete(null);
        //     }
        handleClose();
    }



    return <>
        <Button onClick={handleOpen}>Open Delete Recur Event modal</Button>
        <Dialog onClose={handleClose} open={open}>
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
                            onChange={(event) => setToDelete(event.target.value)}
                        > 
                            <FormControlLabel value="this" 
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
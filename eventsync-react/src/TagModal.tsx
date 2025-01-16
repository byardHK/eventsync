import { Box, Button, Checkbox, Chip, Dialog, FormControlLabel, Grid2, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import DeleteIcon from '@mui/icons-material/Delete';

function TagModal(){
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [chosenTags, setChosenTags] = useState<String[]>([]);
    const [tags, setTags] = useState<String[]>([]);
    const [customTags, setCustomTags] = useState<String[]>([]);

    useEffect(() => {
        getTags().then(setTags);
    }, []);

    useEffect(() => {
        getCustomTags().then(setCustomTags);
    }, []);

    return <>
        <Button onClick={handleOpen}>Open modal</Button>
        <Dialog onClose={handleClose} open={open}>
            <Box
                display="flex" 
                flexDirection="column"
                alignItems="center" 
                justifyContent="center"
            >
                <h3>Create a Custom Tag</h3>
                <Box
                    display="flex" 
                    flexDirection="row"
                >
                    <TextField variant="outlined"></TextField>
                    <Button>Add Tag</Button>
                </Box>
            </Box>
            <Box sx={{ border: 1 }}>
                <Grid2
                    container spacing={1}
                    display="flex"
                    alignItems="center" 
                    justifyContent="center"
                    style={{maxHeight: '40vh', overflow: 'auto'}}
                    padding={1}
                >
                    <h2>Custom Tags</h2>
                    {customTags.map((tag, index) =>
                        <Box 
                            key={index}       
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="center"
                            sx={{width: "100%"}}
                        >    
                            <FormControlLabel control={<Checkbox checked={!!chosenTags.find((_tag) => { return _tag === tag; })} onChange={(event) => {
                                if(event.target.checked){
                                    setChosenTags([...chosenTags, tag])
                                }else{
                                    setChosenTags(chosenTags.filter((_tag) => { return _tag !== tag; }));
                                }                    
                            }}/>} label={tag} />
                            <DeleteIcon/>
                        </Box>
                    )}
                    <h2>Tags</h2>
                    {tags.map((tag, index) =>
                        <Box 
                            key={index}       
                            display="flex"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="center" 
                            sx={{width: "100%"}}
                        >    
                            <FormControlLabel control={<Checkbox checked={!!chosenTags.find((_tag) => { return _tag === tag; })}onChange={(event) => {
                                if(event.target.checked){
                                    setChosenTags([...chosenTags, tag])
                                }else{
                                    setChosenTags(chosenTags.filter((_tag) => { return _tag !== tag; }));
                                }                    
                            }}/>} label={tag} />
                        </Box>
                    )}
                </Grid2>
            </Box>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                flexWrap="wrap"
                padding={3}
            >
                {chosenTags.map((tag, index) =>
                    <Box 
                        key={index}    
                    >    
                        <Chip label={tag} onDelete={() => {
                            setChosenTags(chosenTags.filter((_tag) => { return _tag !== tag; }))
                        }
                        }></Chip>
                    </Box>
                )}
            </Box>
            <Box
                display="flex"
                flexDirection="row"
                alignItems="center" 
                justifyContent="center"
                padding={2}
                gap={2}
            >
                <Button variant="outlined" fullWidth onClick={handleClose}>Cancel</Button>
                <Button variant="outlined" fullWidth onClick={handleClose}>Save</Button>
            </Box>
        </Dialog>
    </>
}

function handleDelete(){
    console.log("Deleted")
    // TODO: delete from chosenTags
}

async function getCustomTags() : Promise<String[]> {
    return [
        "Bungee Jumping",
        "Puppets",
        "Taxidermy"
    ];
}

async function getTags() : Promise<String[]> {
    return [
        "Movie",
        "Game",
        "Outdoors",
        "Book"
    ];
}

export default TagModal
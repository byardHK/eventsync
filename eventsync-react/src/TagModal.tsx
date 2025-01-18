import { Box, Button, Checkbox, Chip, Dialog, FormControlLabel, Grid2, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';

function TagModal(){
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [chosenTags, setChosenTags] = useState<Tag[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [customTags, setCustomTags] = useState<Tag[]>([]);
    const [customTagText, setCustomTagText] = useState<String>("");
    const [getTagsTrigger, setGetTagsTrigger] = useState<number>(0);

    const handleSubmit = async (e: React.FormEvent<HTMLButtonElement>) => {
        
        e.preventDefault();
        try {
            const data = {
                "name": customTagText,
                "userId": 1
            }
            const response = await fetch(`http://localhost:5000/add_custom_tag/${customTagText}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
                setCustomTagText("");
                setGetTagsTrigger(getTagsTrigger+1);
            }
        } catch (error) {
          console.error('Error sending data:', error);
        }
          
    };

    async function deleteCustomTag (tag: Tag) {
        try {
            await axios.delete(`http://localhost:5000/delete_custom_tag/${tag.id}/`);
            setGetTagsTrigger(getTagsTrigger+1);
        } catch (error) {
            console.error('Error deleting tag:', error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/get_tags/');
                const res: Tag[] = response.data;

                const defaultTags: Tag[] = [];
                const customTags: Tag[] = [];
                res.forEach(tag=> {
                    if(tag.userId === null){
                        defaultTags.push(tag);
                    }else{
                        customTags.push(tag);
                    }
                });
                setTags(defaultTags);
                setCustomTags(customTags);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchData();
    }, [getTagsTrigger]);

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
                    <TextField variant="outlined" onChange={(event) => setCustomTagText(event.target.value)}  ></TextField>
                    <Button onClick={handleSubmit}>Add Tag</Button>
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
                            <FormControlLabel control={<Checkbox checked={!!chosenTags.find((_tag) => { return _tag.id === tag.id; })} onChange={(event) => {
                                if(event.target.checked){
                                    setChosenTags([...chosenTags, tag])
                                }else{
                                    setChosenTags(chosenTags.filter((_tag) => { return _tag.id !== tag.id; }));
                                }                    
                            }}/>} label={tag.name} />
                            <Button onClick={() => {
                                deleteCustomTag(tag)
                            }}>
                                <DeleteIcon/>
                            </Button>
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
                            <FormControlLabel control={<Checkbox checked={!!chosenTags.find((_tag) => { return _tag.id === tag.id; })}onChange={(event) => {
                                if(event.target.checked){
                                    setChosenTags([...chosenTags, tag])
                                }else{
                                    setChosenTags(chosenTags.filter((_tag) => { return _tag.id !== tag.id; }));
                                }                    
                            }}/>} label={tag.name} />
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
                        <Chip label={tag.name} onDelete={() => {
                            setChosenTags(chosenTags.filter((_tag) => { return _tag.id !== tag.id; }))
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

type Tag = {
    id: number;
    name: String;
    userId: number;
};

export default TagModal
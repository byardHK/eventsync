import { Box, Button, Checkbox, Chip, Dialog, FormControlLabel, Grid2, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';

type TagModalProps= {
    userTags: Tag[];
    reloadUserTags: () => void;
};

function TagModal({userTags, reloadUserTags}: TagModalProps){
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
    const [customTags, setCustomTags] = useState<Tag[]>([]);
    const [createCustomTagText, setCreateCustomTagText] = useState<String>("");
    const [getTagsTrigger, setGetTagsTrigger] = useState<number>(0);

    function handleOpenModal () {
        setSelectedTags(userTags);
        handleOpen();
    }

    const handleSave = async (e: React.FormEvent<HTMLButtonElement>) => {
        deleteDeselectedTag();
        const tagsToSave: Tag[] = [];
        selectedTags.forEach(tag=> {
            if(!userTags.includes(tag)){
                tagsToSave.push(tag);
            }
        })
        e.preventDefault();
        try {
            const data = {
                "selectedTags": tagsToSave,
                "userId": 1
            }
            const response = await fetch(`http://localhost:5000/save_selected_tags/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
                setCreateCustomTagText("");
            }
        } catch (error) {
          console.error('Error sending data:', error);
        }

        reloadUserTags();
        handleClose();
    };

    const deleteDeselectedTag = async () => {
        const tagsToDelete: Tag[] = [];
        userTags.forEach(tag => {
            if(!selectedTags.includes(tag)){
                tagsToDelete.push(tag);
            }
        })
        try {
            const data = {
                "deselectedTags": tagsToDelete,
                "userId": 1
            }
            const response = await fetch(`http://localhost:5000/delete_user_deselected_tags/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
            }
        } catch (error) {
          console.error('Error sending data:', error);
        }
    };

    const handleCreateCustomTag = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/create_custom_tag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "name": createCustomTagText,
                    "userId": 1
                }),
            });
            if(response.ok){
                console.log('Data sent successfully:', response.json());
                setCreateCustomTagText("");
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
        <Button onClick={handleOpenModal}>Edit Tags</Button>
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
                    <TextField variant="outlined" onChange={(event) => setCreateCustomTagText(event.target.value)}  ></TextField>
                    <Button onClick={handleCreateCustomTag}>Add Tag</Button>
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
                            <FormControlLabel control={<Checkbox checked={!!selectedTags.find((_tag) => { return _tag.id === tag.id; })} onChange={(event) => {
                                if(event.target.checked){
                                    setSelectedTags([...selectedTags, tag])
                                }else{
                                    setSelectedTags(selectedTags.filter((_tag) => { return _tag.id !== tag.id; }));
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
                            <FormControlLabel control={<Checkbox checked={!!selectedTags.find((_tag) => { return _tag.id === tag.id; })}onChange={(event) => {
                                if(event.target.checked){
                                    setSelectedTags([...selectedTags, tag])
                                }else{
                                    setSelectedTags(selectedTags.filter((_tag) => { return _tag.id !== tag.id; }));
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
                {selectedTags.map((tag, index) =>
                    <Box 
                        key={index}    
                    >    
                        <Chip label={tag.name} onDelete={() => {
                            setSelectedTags(selectedTags.filter((_tag) => { return _tag.id !== tag.id; }))
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
                <Button variant="outlined" fullWidth onClick={handleSave}>Save</Button>
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
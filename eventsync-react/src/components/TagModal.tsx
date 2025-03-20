import { Box, Button, Checkbox, Chip, Dialog, FormControlLabel, Grid2, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useUser } from '../sso/UserContext';
import Tag from '../types/Tag';
import { BASE_URL } from './Constants';

type TagModalProps= {
    savedTags: Tag[];
    handleSave: (tagsToAdd: Tag[], tagsToDelete: Tag[]) => Promise<void>;
};

function TagModal({savedTags, handleSave}: TagModalProps){
    const { userDetails } = useUser();
    const userId = userDetails.email;
    const token = userDetails.token;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [defaultTags, setDefaultTags] = useState<Tag[]>([]);
    const [customTags, setCustomTags] = useState<Tag[]>([]);
    const [createCustomTagText, setCreateCustomTagText] = useState<String>("");
    const [getTagsTrigger, setGetTagsTrigger] = useState<number>(0);

    function handleOpenModal () {
        setSelectedTags(savedTags);
        handleOpen();
    }

    function onSave() {
        const tagsToDelete: Tag[] = [];
        savedTags.forEach(tag => {
            if(!selectedTags.includes(tag)){
                tagsToDelete.push(tag);
            }
        });
        
        const tagsToAdd: Tag[] = [];
        selectedTags.forEach(tag=> {
            if(!savedTags.includes(tag)){
                tagsToAdd.push(tag);
            }
        });

        handleSave(tagsToAdd, tagsToDelete);
        handleClose();
    }

    const handleCreateCustomTag = async (e: React.FormEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (!createCustomTagText.trim()) {
            setErrorMessage('Tag name cannot be empty');
            return;
        }
        if (defaultTags.some(tag => tag.name === createCustomTagText) || customTags.some(tag => tag.name === createCustomTagText)) {
            setErrorMessage(`Cannot create duplicate tag: ${createCustomTagText}`);
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/create_custom_tag`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "name": createCustomTagText,
                    "userId": userId
                }),
            });
            if(response.ok){
                const data = await response.json();
                console.log('Data sent successfully:', data);
                setCreateCustomTagText("");
                setGetTagsTrigger(getTagsTrigger+1);
                setErrorMessage(null);
            }
        } catch (error) {
          console.error('Error sending data:', error);
        }
          
    };

    async function deleteCustomTag (tag: Tag) {
        try {
            await axios.delete(`${BASE_URL}/delete_custom_tag/${tag.id}/`);
            setGetTagsTrigger(getTagsTrigger+1);
        } catch (error) {
            console.error('Error deleting tag:', error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_tags/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${userDetails.token}`,
                        'Content-Type': 'application/json',
                    },
                });
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
                setDefaultTags(defaultTags);
                setCustomTags(customTags);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchData();
    }, [getTagsTrigger]);

    return <>
        <Button 
            variant="outlined" 
            sx={{ minWidth: '40px', minHeight: '40px', padding: 0 }}
            onClick={handleOpenModal}
            title="edit tags"
        >
            <AddIcon />
        </Button>
        <Dialog onClose={handleClose} open={open} fullWidth maxWidth="md">
            <Box
                display="flex" 
                flexDirection="column"
                alignItems="center" 
                justifyContent="center"
                padding={2}
            >
                <Typography variant="h5">Create a Custom Tag</Typography>
                {errorMessage && <div className="error-message" style={{ color: 'red' }}>{errorMessage}</div>}
                <Box
                    display="flex" 
                    flexDirection="row"
                    paddingTop={2}
                >
                    <TextField variant="outlined" value={createCustomTagText} onChange={(event) => setCreateCustomTagText(event.target.value)}  ></TextField>
                    <Button size="small" variant="contained" onClick={handleCreateCustomTag}>Add Tag</Button>
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
                    <Typography variant="h4">Custom Tags</Typography>
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
                    <Typography variant="h4">Default Tags</Typography>
                    {defaultTags.map((tag, index) =>
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
                padding={2}
            >
                {selectedTags.map((tag, index) =>
                    <Box 
                        key={index} 
                    >    
                        <Chip sx={{margin:1, backgroundColor: 'rgba(82, 113, 255, 0.5)', color: "black" }} label={tag.name} onDelete={() => {
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
                <Button variant="contained" fullWidth onClick={handleClose}>Cancel</Button>
                <Button variant="contained" fullWidth onClick={onSave}>Save</Button>
            </Box>
        </Dialog>
    </>
}

export default TagModal
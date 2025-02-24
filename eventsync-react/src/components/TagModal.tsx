import { Box, Button, Checkbox, Chip, Dialog, FormControlLabel, Grid2, TextField } from '@mui/material';
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

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);
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
        try {
            const response = await fetch(`${BASE_URL}/create_custom_tag`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    "name": createCustomTagText,
                    "userId": userId
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
            await axios.delete(`${BASE_URL}/delete_custom_tag/${tag.id}/`);
            setGetTagsTrigger(getTagsTrigger+1);
        } catch (error) {
            console.error('Error deleting tag:', error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${BASE_URL}/get_tags/${userId}`);
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
        <Button 
            variant="outlined" 
            sx={{ minWidth: '40px', minHeight: '40px', padding: 0 }}
            onClick={handleOpenModal}
            title="edit tags"
        >
            <AddIcon />
        </Button>
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
                    <TextField variant="outlined" value={createCustomTagText} onChange={(event) => setCreateCustomTagText(event.target.value)}  ></TextField>
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
                <Button variant="outlined" fullWidth onClick={onSave}>Save</Button>
            </Box>
        </Dialog>
    </>
}

export default TagModal
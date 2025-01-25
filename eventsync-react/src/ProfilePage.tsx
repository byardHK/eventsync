import { Box, Chip } from "@mui/material";
import TagModal, { Tag } from "./TagModal";
import { useEffect, useState } from "react";
import axios from "axios";

// TODO: Create save function that saves and deletes and pass it in as a parameter to tag modal


function ProfilePage(){
    const userId = 1;
    const [userTagsTrigger, setUserTagsTrigger] = useState<number>(0);
    const [userTags, setUserTags] = useState<Tag[]>([]);

    const handleSave = async (tagsToAdd: Tag[], tagsToDelete: Tag[]) => {
        try {
            const deselectedData = {
                "deselectedTags": tagsToDelete,
                "userId": 1
            }
            const deleteResponse = await fetch(`http://localhost:5000/delete_user_deselected_tags/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(deselectedData),
            });
            const selectedData = {
                "selectedTags": tagsToAdd,
                "userId": 1
            }
            const saveResponse = await fetch(`http://localhost:5000/save_user_selected_tags/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(selectedData),
            });
            if(deleteResponse.ok && saveResponse.ok){
                console.log('Data sent successfully:', deleteResponse.json());
            }
        } catch (error) {
            console.error('Error sending data:', error);
        }

    reloadUserTags();
};

    function reloadUserTags() {
        setUserTagsTrigger(userTagsTrigger+1);
    }
    
    function ListTags(){
        return <>
            {userTags.map((tag, index) =>
                <Box 
                    key={index}
                >    
                    <Chip label={tag.name}></Chip>
                </Box>
            )}
        </>
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/get_user_tags/${userId}/`);
                const res: Tag[] = response.data;
                setUserTags(res);
            } catch (error) {
                console.error('Error fetching tags:', error);
            }
        };
        fetchData();
    }, [userTagsTrigger]);

    return <>
        <Box
            display="flex"
            flexDirection="column"
        >
            <ListTags></ListTags>
            <TagModal savedTags={userTags} handleSave={handleSave}></TagModal>
        </Box>
    </>
}

export default ProfilePage
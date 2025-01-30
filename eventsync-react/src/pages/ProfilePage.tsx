import { Box, Chip } from "@mui/material";
import TagModal, { Tag } from "../components/TagModal";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "../sso/UserContext";

function ProfilePage(){
    const { userDetails } = useUser();
    const userId = userDetails.email;
    const [userTags, setUserTags] = useState<Tag[]>([]);
    const [userTagsTrigger, setUserTagsTrigger] = useState<number>(0);

    const handleSave = async (tagsToAdd: Tag[], tagsToDelete: Tag[]) => {
        try {
            const deselectedData = {
                "deselectedTags": tagsToDelete,
                "userId": userId
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
                "userId": userId
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
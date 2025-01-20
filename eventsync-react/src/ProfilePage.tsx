import { Box, Chip } from "@mui/material";
import TagModal from "./TagModal";
import { useEffect, useState } from "react";
import axios from "axios";

function ProfilePage(){

    const userId = 1;
    const [userTags, setUserTags] = useState<Tag[]>([]);

    
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
    }, []);

    return <>
        <Box
            display="flex"
            flexDirection="column"
        >
            <ListTags></ListTags>
            <TagModal></TagModal>
        </Box>
    </>
}


type Tag = {
    id: number;
    name: String;
    userId: number;
};

export default ProfilePage
import { Box, Button } from "@mui/material"
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { REDIRECT_URI } from './Constants';

function BackButton() {
    const navigate = useNavigate();

    const handleBackClick = () => {
        if (window.performance?.navigation?.type === 1 || document.referrer === "") {
            navigate('/'); 
        } else {
            navigate(-1);
        }
    };

    return (
        <Button onClick={handleBackClick}>
            <ArrowBackIcon fontSize="large"/>
        </Button>
    )
}

export default BackButton;
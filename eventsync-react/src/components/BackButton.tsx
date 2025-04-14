import { Box, Button } from "@mui/material"
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { REDIRECT_URI } from './Constants';
import { useLocation } from "react-router-dom";

function BackButton() {
    const navigate = useNavigate();

    const handleBackClick = () => {
        if (navigate.length == 0) {
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
import { Box, Button } from "@mui/material"
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { REDIRECT_URI } from './Constants';
import { useLocation } from "react-router-dom";

function BackButton() {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBackClick = () => {
        console.log(navigate.length);
        if (location.key !== 'default') {
            navigate(-1);
        } else {
            navigate('/'); 
        }
    };

    return (
        <Button onClick={handleBackClick}>
            <ArrowBackIcon fontSize="large"/>
        </Button>
    )
}

export default BackButton;
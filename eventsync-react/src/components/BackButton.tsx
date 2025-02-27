import { Button } from "@mui/material"
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

function BackButton() {
    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate(-1);
    };

    return (<Button onClick={handleBackClick}>
                <ArrowBackIcon />
            </Button>
        )
}

export default BackButton;
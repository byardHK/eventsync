import { Box, Button, Paper, styled } from "@mui/material";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';

function AdminPage(){
    return <>
        <Box>
            <AdminReportCard></AdminReportCard>
        </Box>
    </>
}

function AdminReportCard(){
    const ReportCard = styled(Paper)(({ theme }) => ({
        width: 300,
        height: 175,
        padding: theme.spacing(1),
        ...theme.typography.body2,
        textAlign: 'center',
      }));
    return <Box>
        <ReportCard elevation={10} square={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '200px'}}>
            <Box display="flex" flexDirection="row" gap={2} >
                <Button variant="contained">
                    <RemoveRedEyeIcon/>
                </Button>
                <Button variant="contained">
                    <DeleteIcon/>
                </Button>
                <Button variant="contained">
                    <WarningIcon/>
                </Button>
                <Button variant="contained">
                    <BlockIcon/>
                </Button>
            </Box>
        </ReportCard>
    </Box>
      
}

export default AdminPage
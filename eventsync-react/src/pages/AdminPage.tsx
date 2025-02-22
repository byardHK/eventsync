import { Box, Button, Paper, styled } from "@mui/material";
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import BlockIcon from '@mui/icons-material/Block';
import { ReactNode, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BottomNavBar from "../components/BottomNavBar";
import { BASE_URL } from "../components/Cosntants";

type Report = {
    id: number;
    details: string;
    reportedBy: string;
    reportedUserId: number;
    reportedMessageId: number;
    reportedEventInfoId: number;
    reportedGroupId: number;
    reportedTagId: number;
    reportedItemId: number;
    reportDate: string;
};

function AdminPage(){

    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate('/');
    };
    
    const [reports, setReports] = useState<Report[]>([]);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await axios.get(`${BASE_URL}/get_reports`);
            const res: Report[] = response.data;
            setReports(res);
          } catch (error) {
            console.error('Error fetching data:', error);
          }
        };
        fetchData();
    }, []);

    return <>
        <Button onClick={handleBackClick}>
            <ArrowBackIcon />
        </Button>
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
        >
            {reports.map(report =>
                <AdminReportCard report={report} key={report.id}/>
            )}
        </Box>
    </>
}

type AdminReportCardProps = {
    report: Report;
};

function AdminReportCard({report} : AdminReportCardProps){
    const ReportCard = styled(Paper)(({ theme }) => ({
        width: 300,
        height: 175,
        padding: theme.spacing(1),
        ...theme.typography.body2,
        textAlign: 'center',
      }));
    return <Box>
        <ReportCard elevation={10} square={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '200px'}}>
            <h1>{ReportType(report)} Report</h1>
            <p>{report.details}</p>
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

function ReportType(report: Report){
    if(report.reportedEventInfoId != null){
        return "Event";
    }else if(report.reportedGroupId != null){
        return "Group";
    }else if(report.reportedItemId != null){
        return "Item";
    }else if(report.reportedMessageId != null){
        return "Message";
    }else if(report.reportedTagId != null){
        return "Tag";
    }else if(report.reportedUserId != null){
        return "User";
    }else{
        "Broken"
    }
}

export default AdminPage
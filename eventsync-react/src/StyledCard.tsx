// The share modal / navigation part of this page was written with generative AI.

import { Box, Button, Chip,  Paper, styled, Typography } from "@mui/material"
import { ReactNode, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import EventSyncEvent from "./types/EventSyncEvent";
import IosShareIcon from '@mui/icons-material/IosShare';

export type StyledCardProps = {
    children?: ReactNode;
    event: EventSyncEvent;
    showTags?: boolean;
    showViews?: boolean;
    showShareIcon?: boolean;
    height?: number;
    viewEvent: (event : EventSyncEvent) => Promise<void>;
};

function StyledCard({ children, event, showTags, showViews, showShareIcon, height, viewEvent }: StyledCardProps) {
    const [shareOpen, setShareOpen] = useState(false);
    console.log(shareOpen);
    const eventUrl = `${window.location.origin}/viewEvent/${event.id}`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: event.eventName,
                    url: eventUrl,
                });
                setShareOpen(false);
            } catch (error) {
                console.error("Error sharing:", error);
            }
        } else {
            navigator.clipboard.writeText(eventUrl);
            alert("Link copied to clipboard!");
        }
    };

    const EventCard = styled(Paper)(({ theme }) => ({
        width: 250,
        height: height ? height : 175,
        padding: theme.spacing(2),
        textAlign: 'center',
    }));

    const start = dayjs(event.startTime);
    const end = dayjs(event.endTime);

    return (
        <Box display="flex" justifyContent="center" alignItems="center">
            <EventCard elevation={10} sx={{padding:2}}>
                <Box onClick={() => viewEvent(event)} style={{ cursor: "pointer"}}>
                    <Typography variant="h5" fontWeight="bold">{event.eventName}</Typography>
                    <br></br>
                    {start.isSame(end, "date") ? (
                        <>
                            <Typography>{`${timeToString2Date(start, end)}`}</Typography>
                            <Typography>{`${timeToString2Time(start, end)}`}</Typography>
                        </>
                    ) : (
                        <>
                            <Typography>{`${timeToStringDate(start)} ${timeToStringTime(start)}`}</Typography>
                            <Typography>to</Typography>
                            <Typography>{`${timeToStringDate(end)} ${timeToStringTime(end)}`}</Typography>
                        </>
                    )}
                    <br></br>
                    {showTags && (
                        <Box display="flex" flexWrap="wrap" justifyContent="center">
                            {event.tags.map((tag, index) => (
                                <Chip key={index} label={tag.name} style={{ margin: 2, backgroundColor: 'rgba(133, 156, 249, 0.5)', color:"black" }}  />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Share Button */}
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    {showViews && <p>{`${event.views} Views`}</p>}
                    {showShareIcon && (
                        <Button
                            onClick={handleShare}
                            startIcon={<IosShareIcon sx={{ color: "black" }} />} // Make icon black
                        //     sx={{
                        //         backgroundColor: "white", 
                        //         color: "black", 
                        //         padding: "8px 8px", 
                        //         minWidth: "60px", 
                        //         "&:hover": {
                        //             backgroundColor: "white", 
                        //             color: "black", 
                        //         },
                        //     }}
                        // 
                        >
                        </Button>
                    )}
                </Box>
                
                {children}
            </EventCard>

            {/* Share Modal */}
            {/* <Modal open={shareOpen} onClose={() => setShareOpen(false)}>
                <Box className="modal-container">
                    <h3>Share Event</h3>
                    <p>Share this event with others:</p>
                    <Button variant="contained" onClick={handleShare} startIcon={<IosShareIcon />} fullWidth>
                        Share Link
                    </Button>
                    <Button 
                        variant="outlined" 
                        onClick={() => { navigator.clipboard.writeText(eventUrl); alert("Copied!"); }} 
                        startIcon={<ContentCopy />} 
                        fullWidth
                    >
                        Copy Link
                    </Button>
                </Box>
            </Modal> */}
        </Box>
    );
}

// Helper functions for formatting time
export function timeToStringDate(dayjsTime: Dayjs): string {
    return `${dayjsTime.format("dddd (M/D)")}`;
}

export function timeToStringTime(dayjsTime: Dayjs): string {
    return `${dayjsTime.format("h:mm A")}`;
}

export function timeToString2Date(startTime: Dayjs, endTime: Dayjs): string {
    return `${startTime.format("dddd (M/D)")}`;
}

export function timeToString2Time(startTime: Dayjs, endTime: Dayjs): string {
    return `${startTime.format("h:mm A")} - ${endTime.format("h:mm A")}`;
}

export default StyledCard;
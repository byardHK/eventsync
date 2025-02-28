// The share modal / navigation part of this page was written with generative AI.

import { Box, Button, Chip,  Paper, styled } from "@mui/material"
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
    viewEvent: (event : EventSyncEvent) => Promise<void>;
};

function StyledCard({ children, event, showTags, showViews, showShareIcon, viewEvent }: StyledCardProps) {
    const [shareOpen, setShareOpen] = useState(false);
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
        height: 200,
        padding: theme.spacing(2),
        textAlign: 'center',
    }));

    const start = dayjs(event.startTime);
    const end = dayjs(event.endTime);

    return (
        <Box display="flex" justifyContent="center" alignItems="center">
            <EventCard elevation={10}>
                <div onClick={() => viewEvent(event)} style={{ cursor: "pointer" }}>
                    <p>{`Name: ${event.eventName}`}</p>
                    {start.isSame(end, "date") ? (
                        <p>{`Time: ${timeToString2(start, end)}`}</p>
                    ) : (
                        <>
                            <p>{`Start: ${timeToString(start)}`}</p>
                            <p>{`End: ${timeToString(end)}`}</p>
                        </>
                    )}
                    {showTags && (
                        <Box display="flex" flexWrap="wrap" justifyContent="center">
                            {event.tags.map((tag, index) => (
                                <Chip key={index} label={tag.name} style={{ margin: 2 }} />
                            ))}
                        </Box>
                    )}
                    {showViews && <p>{`${event.views} Views`}</p>}
                </div>

                {/* Share Button */}
                {showShareIcon && (
                    <Button
                        onClick={handleShare}
                        startIcon={<IosShareIcon sx={{ color: "black" }} />} // Make icon black
                        sx={{
                            backgroundColor: "white", 
                            color: "black", 
                            padding: "8px 8px", 
                            minWidth: "60px", 
                            "&:hover": {
                                backgroundColor: "white", 
                                color: "black", 
                            },
                        }}
                    >
                    </Button>
                )}
                
              

                
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
export function timeToString(dayjsTime: Dayjs): string {
    return `${dayjsTime.format("dddd, M/D")} at ${dayjsTime.format("h:mm A")}`;
}

export function timeToString2(startTime: Dayjs, endTime: Dayjs): string {
    return `${startTime.format("dddd, M/D")} from ${startTime.format("h:mm A")} - ${endTime.format("h:mm A")}`;
}

export default StyledCard;
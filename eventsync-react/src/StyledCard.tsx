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
        width: 300,
        minHeight: height ? height : 175,
        padding: theme.spacing(2),
        textAlign: 'center',
    }));

    const start = dayjs(event.startTime);
    const end = dayjs(event.endTime);

    function getMessageStr(name: string | null) {
        if(!name) {
          return "";
        }
    
        if(name.length < 35) {
            return name
        }
        return name.substring(0, 32) + "..."
      }
    

    return (
        <Box display="flex" justifyContent="center" alignItems="center">
            <EventCard elevation={10} sx={{padding:2}}>
                <Box onClick={() => viewEvent(event)} style={{ cursor: "pointer"}}>
                    <Typography sx={{wordBreak: "break-word"}} variant="h5" fontWeight="bold">{getMessageStr(event.eventName)}</Typography>
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
                                <Chip key={index} label={tag.name} style={{ margin: 2, backgroundColor: '#71A9F7', color:"black" }}  />
                            ))}
                        </Box>
                    )}
                </Box>

                {/* Share Button */}
                <Box display="flex" flexDirection="row" justifyContent="space-between">
                    {showViews && <Typography>{`${event.views} Views`}</Typography>}
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
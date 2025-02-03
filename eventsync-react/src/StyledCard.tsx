import { Box, Chip, IconButton, Paper, styled } from "@mui/material"
import React, { ReactNode, useEffect, useState } from "react";
import { EventSyncEvent } from "./pages/HomePage";
import dayjs, { Dayjs } from "dayjs";
import { Tag } from "./components/TagModal";
import axios from "axios";
import { useUser } from "./sso/UserContext";

export type StyledCardProps = {
    children?: ReactNode;
    key: React.Key;
    event: EventSyncEvent;
    showTags?: boolean;
    showViews?: boolean;
    viewEvent: (event : EventSyncEvent) => Promise<void>;
};

function StyledCard({children, key, event, showTags, showViews, viewEvent} : StyledCardProps){
    const EventCard = styled(Paper)(({ theme }) => ({
        width: 250,
        height: 175,
        padding: theme.spacing(2),
        ...theme.typography.body2,
        textAlign: 'center',
      }));
    
    const { userDetails } = useUser();
    const currentUserId = userDetails.email;

    const start = dayjs(event.startTime);
    const end = dayjs(event.endTime);

    const [eventTags, setEventTags] = useState<Tag[]>([]);
    useEffect(() => {
        if(!showTags) { return; }
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/get_event/${event.id}/${currentUserId}`);
                setEventTags(response.data.tags);
            } catch (error) {
                console.error('Error fetching event:', error);
            }
        }
        fetchEvent();
    }, [event.id, showTags]);

    return (
        <Box key={key} display="flex" justifyContent="center" alignItems="center">
            <EventCard elevation={10} square={false}>
                <div onClick={() => { viewEvent(event); }} style={{cursor: "pointer"}}>
                    <p>{`Name: ${event.eventName}`}</p>
                    {start.isSame(end, "date") ?
                        <>
                            <p>{`Time: ${timeToString2(start, end)}`}</p>
                        </> :
                        <>
                            <p>{`Start: ${timeToString(start)}`}</p>
                            <p>{`End: ${timeToString(end)}`}</p>
                        </>
                    }
                    {showTags ? 
                    <Box
                        display="flex"
                        flexDirection="row"
                        alignItems="center"
                        justifyContent="center"
                        flexWrap="wrap"
                    >
                        {eventTags.map((tag, index) =>
                            <Box 
                                key={index}
                            >    
                                <Chip label={tag.name}></Chip>
                            </Box>
                        )}
                    </Box> :
                    <></>
                    }
                    { showViews ? <p>{`${event.views} Views`}</p> : <></>}
                </div>
                {children}
            </EventCard>
        </Box>
    )
}

function timeToString(dayjsTime : Dayjs) : string {
    return `${dayjsTime.format("dddd, M/D")} at ${dayjsTime.format("h:mm A")}`;
}

function timeToString2(startTime : Dayjs, endTime: Dayjs) : string {
    return `${startTime.format("dddd, M/D")} from ${startTime.format("h:mm A")} - ${endTime.format("h:mm A")}`;
}

export default StyledCard
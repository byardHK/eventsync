import Tag from "./Tag";

type EventSyncEvent = {
    eventName : string;
    // attendees : Number; TODO
    startTime: string;
    endTime: string;
    views: number;
    id: number;
    recurs: number;
    tags: Tag[];
    creatorId: string;
    numRsvps: number;
    RSVPLimit: number;
    isPublic: Boolean;
};

export default EventSyncEvent;
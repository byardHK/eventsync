import { Dayjs } from "dayjs";

type EventInfo = {
    id: number;
    creatorId: string;
    title: string;
    description: string;
    locationName: string;
    locationLink: string;
    rsvpLimit: number;
    isPublic: boolean;
    isWeatherDependant: boolean;
    numTimesReported: number;
    eventInfoCreated: Dayjs;
    venmo: string;
    recurFrequency: number;
    creatorName: string;
};

export default EventInfo;
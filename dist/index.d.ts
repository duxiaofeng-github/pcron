import dayjs from "dayjs";
interface Range {
    start: number;
    end: number;
}
interface Options {
    period: string;
    year: Range[];
    month?: Range[];
    weekOfYear?: Range[];
    weekOfMonth?: Range[];
    weekday?: Range[];
    day?: Range[];
    hour: Range[];
    min: Range[];
    sec: Range[];
}
declare class Result {
    private options;
    private originalTimestamp;
    private currentTime;
    private hasPrev;
    private hasNext;
    constructor(options: Options, timestamp?: number);
    reset(): void;
    prev(): dayjs.Dayjs | null;
    next(): dayjs.Dayjs | null;
}
export declare function parseExpression(expression: string, timestamp?: number): Result;
export {};

import dayjs from "dayjs";
import { Options } from "./utils";
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

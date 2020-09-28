import { Dayjs, OpUnitType } from "dayjs";
export interface Range {
    start: number;
    end: number;
}
export interface Options {
    period: string;
    year: Range[];
    month?: Range[];
    day?: Range[];
    hour: Range[];
    min: Range[];
    sec: Range[];
}
export declare enum Unit {
    Year = "year",
    Month = "month",
    Day = "day",
    Hour = "hour",
    Min = "minute",
    Sec = "second"
}
export declare function getPrevUnit(unit: Unit): Unit.Year | Unit.Month | Unit.Day | Unit.Hour | Unit.Min | null;
export declare function getNextUnit(unit: Unit): Unit | null;
export declare function getPeriodByUnit(period: string, unit: Unit): number;
export declare function validateRange(start: number, end: number, type: Unit): boolean;
export declare function transformUnitToDayjsUnit(unit: Unit): OpUnitType;
export declare function getRangesByUnit(options: Options, unit: Unit): Range[] | undefined;
export declare function getValueByUnit(time: Dayjs, unit: Unit): number;
export declare function withDefaultRanges(unit: Unit, ranges: Range[] | undefined): Range[] | undefined;
export declare function getRangeInfo(num: number, ranges: Range[], isNext: boolean): {
    rangeIndex: number;
    inRange: boolean;
};

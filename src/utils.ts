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

export enum Unit {
  Year = "year",
  Month = "month",
  Day = "day",
  Hour = "hour",
  Min = "minute",
  Sec = "second",
}

const defaultRanges = {
  [Unit.Year]: [-10000, 10000],
  [Unit.Month]: [1, 12],
  [Unit.Day]: [1, 31],
  [Unit.Hour]: [0, 23],
  [Unit.Min]: [0, 59],
  [Unit.Sec]: [0, 59],
};

function getDefaultRange(unit: Unit): Range[] {
  const range = defaultRanges[unit];

  return [{ start: range[0], end: range[1] }];
}

export function getPrevUnit(unit: Unit) {
  switch (unit) {
    case Unit.Sec:
      return Unit.Min;
    case Unit.Min:
      return Unit.Hour;
    case Unit.Hour:
      return Unit.Day;
    case Unit.Day:
      return Unit.Month;
    case Unit.Month:
      return Unit.Year;
    case Unit.Year:
      return null;
  }
}

export function getNextUnit(unit: Unit): Unit | null {
  switch (unit) {
    case Unit.Sec:
      return null;
    case Unit.Min:
      return Unit.Sec;
    case Unit.Hour:
      return Unit.Min;
    case Unit.Day:
      return Unit.Hour;
    case Unit.Month:
      return Unit.Day;
    case Unit.Year:
      return Unit.Month;
  }
}

export function getPeriodByUnit(period: string, unit: Unit): number {
  const [dateSection, timeSection = ""] = period.replace("P", "").split("T");
  let result;

  switch (unit) {
    case Unit.Sec:
      result = timeSection.match(/(\d+)s/i);
      break;
    case Unit.Min:
      result = timeSection.match(/(\d+)m/i);
      break;
    case Unit.Hour:
      result = timeSection.match(/(\d+)h/i);
      break;
    case Unit.Day:
      result = dateSection.match(/(\d+)d/i);
      break;
    case Unit.Month:
      result = dateSection.match(/(\d+)m/i);
      break;
    case Unit.Year:
      result = dateSection.match(/(\d+)y/i);
      break;
  }

  const periodNumber = result ? parseInt(result[1]) : 0;

  if (isNaN(periodNumber)) {
    throw new Error(`invalid period ${period}, unit: ${unit}`);
  }

  return periodNumber;
}

export function validateRange(start: number, end: number, type: Unit) {
  if (isNaN(start) || isNaN(end)) {
    return false;
  }

  const range = defaultRanges[type];

  if (range == null) {
    return true;
  }

  const [startEdge, endEdge] = range;

  return start >= startEdge && end <= endEdge;
}

export function transformUnitToDayjsUnit(unit: Unit): OpUnitType {
  switch (unit) {
    case Unit.Sec:
      return "second";
    case Unit.Min:
      return "minute";
    case Unit.Hour:
      return "hour";
    case Unit.Day:
      return "day";
    case Unit.Month:
      return "month";
    case Unit.Year:
      return "year";
  }
}

export function getRangesByUnit(options: Options, unit: Unit) {
  const { year, month, day, hour, min, sec } = options;

  switch (unit) {
    case Unit.Sec:
      return sec;
    case Unit.Min:
      return min;
    case Unit.Hour:
      return hour;
    case Unit.Day:
      return day;
    case Unit.Month:
      return month;
    case Unit.Year:
      return year;
  }
}

export function getValueByUnit(time: Dayjs, unit: Unit) {
  switch (unit) {
    case Unit.Sec:
      return time.second();
    case Unit.Min:
      return time.minute();
    case Unit.Hour:
      return time.hour();
    case Unit.Day:
      return time.date();
    case Unit.Month:
      return time.month() + 1;
    case Unit.Year:
      return time.year();
  }
}

export function withDefaultRanges(unit: Unit, ranges: Range[] | undefined) {
  if (ranges == null) {
    return undefined;
  }

  if (ranges.length === 0) {
    return getDefaultRange(unit);
  }

  return ranges;
}

export function getRangeInfo(num: number, ranges: Range[], isNext: boolean) {
  let rangeIndex = isNext ? -1 : ranges.length;
  let inRange = false;

  for (let i = 0; i < ranges.length; i++) {
    const nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
    const nextRange = ranges[nextRangeIndex];

    if ((isNext && num >= nextRange.start) || (!isNext && num <= nextRange.end)) {
      rangeIndex = nextRangeIndex;
    }

    if (num >= nextRange.start && num <= nextRange.end) {
      inRange = true;

      break;
    }
  }

  return { rangeIndex, inRange };
}

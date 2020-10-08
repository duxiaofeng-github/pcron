import dayjs, { Dayjs, OpUnitType } from "dayjs";

export interface Range {
  start: number;
  end: number;
}

export interface Options {
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

export enum Unit {
  Year = "year",
  Month = "month",
  Day = "day",
  WeekOfYear = "weekOfYear",
  Weekday = "weekday",
  WeekOfMonth = "weekOfMonth",
  Hour = "hour",
  Min = "minute",
  Sec = "second",
}

const defaultRanges = {
  [Unit.Year]: [-10000, 10000],
  [Unit.Month]: [1, 12],
  [Unit.Day]: [1, 31],
  [Unit.WeekOfYear]: [1, 53],
  [Unit.WeekOfMonth]: [1, 6],
  [Unit.Weekday]: [0, 6],
  [Unit.Hour]: [0, 23],
  [Unit.Min]: [0, 59],
  [Unit.Sec]: [0, 59],
};

function getDefaultRange(unit: Unit): Range[] {
  const range = defaultRanges[unit];

  return [{ start: range[0], end: range[1] }];
}

export function isWeek(expression: string) {
  return expression.indexOf("/") !== -1;
}

export function isWeekOfYear(blocks: string[]) {
  return blocks.length === 6;
}

export function getPrevUnit(unit: Unit, options: Options): Unit | null {
  const { weekOfMonth: weekOfMonthRanges, day: dayRanges } = options;

  switch (unit) {
    case Unit.Sec:
      return Unit.Min;
    case Unit.Min:
      return Unit.Hour;
    case Unit.Hour:
      return dayRanges != null ? Unit.Day : Unit.Weekday;
    case Unit.Day:
      return Unit.Month;
    case Unit.Weekday:
      return weekOfMonthRanges != null ? Unit.WeekOfMonth : Unit.WeekOfYear;
    case Unit.WeekOfMonth:
      return Unit.Month;
    case Unit.WeekOfYear:
      return Unit.Year;
    case Unit.Month:
      return Unit.Year;
    case Unit.Year:
      return null;
  }
}

export function getNextUnit(unit: Unit, options: Options): Unit | null {
  const { weekOfYear: weekOfYearRanges, weekOfMonth: weekOfMonthRanges } = options;

  switch (unit) {
    case Unit.Sec:
      return null;
    case Unit.Min:
      return Unit.Sec;
    case Unit.Hour:
      return Unit.Min;
    case Unit.Day:
      return Unit.Hour;
    case Unit.Weekday:
      return Unit.Hour;
    case Unit.WeekOfMonth:
      return Unit.Weekday;
    case Unit.WeekOfYear:
      return Unit.Weekday;
    case Unit.Month:
      return weekOfMonthRanges != null ? Unit.WeekOfMonth : Unit.Day;
    case Unit.Year:
      return weekOfYearRanges != null ? Unit.WeekOfYear : Unit.Month;
  }
}

export function getPeriodByUnit(period: string, unit: Unit): number {
  const [dateSection, timeSection = ""] = period.toLowerCase().replace(/p/i, "").split("t");
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
    case Unit.Weekday:
      result = dateSection.match(/(\d+)d/i);
      break;
    case Unit.WeekOfMonth:
    case Unit.WeekOfYear:
      result = dateSection.match(/(\d+)w/i);
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
    case Unit.Weekday:
      return "day";
    case Unit.WeekOfMonth:
      return "week";
    case Unit.WeekOfYear:
      return "week";
    case Unit.Day:
      return "day";
    case Unit.Month:
      return "month";
    case Unit.Year:
      return "year";
  }
}

export function getRangesByUnit(unit: Unit, time: Dayjs, options: Options): Range[] | undefined {
  const { year, month, weekOfYear, weekOfMonth, weekday, day, hour, min, sec } = options;

  switch (unit) {
    case Unit.Sec:
      return sec;
    case Unit.Min:
      return min;
    case Unit.Hour:
      return hour;
    case Unit.Day:
      return day;
    case Unit.Weekday:
      return weekday
        ? weekday.map((range) => {
            return adjustWeekdayRange(range, time);
          })
        : undefined;
    case Unit.WeekOfMonth:
      return weekOfMonth;
    case Unit.WeekOfYear:
      return weekOfYear;
    case Unit.Month:
      return month;
    case Unit.Year:
      return year;
  }
}

function adjustWeekdayRange(range: Range, time: Dayjs): Range {
  const firstWeek = 1;
  const startOfMonth = time.startOf("month");
  const endOfMonth = time.endOf("month");
  const firstWeekdayOfMonth = startOfMonth.weekday();
  const lastWeekdayOfMonth = endOfMonth.weekday();
  const lastWeekOfMonth = getWeek(endOfMonth) - getWeek(startOfMonth) + 1;
  const endOfYear = time.endOf("year");
  const lastWeekOfYear = getWeek(endOfYear);
  const lastWeekdayOfYear = endOfYear.weekday();
  const weekOfMonthValue = getValueByUnit(time, Unit.WeekOfMonth);
  const weekOfYearValue = getValueByUnit(time, Unit.WeekOfYear);

  if (weekOfMonthValue === firstWeek && range.start <= firstWeekdayOfMonth && range.end >= firstWeekdayOfMonth) {
    return { start: firstWeekdayOfMonth, end: range.end };
  } else if (weekOfMonthValue === lastWeekOfMonth && range.start <= lastWeekdayOfMonth && range.end >= lastWeekdayOfMonth) {
    return { start: range.start, end: lastWeekdayOfMonth };
  } else if (weekOfYearValue === lastWeekOfYear && range.start <= lastWeekdayOfYear && range.end >= lastWeekdayOfYear) {
    return { start: range.start, end: lastWeekdayOfYear };
  }

  return range;
}

function getWeek(time: Dayjs) {
  return time.week() === 0 && time.month() !== 0 ? time.subtract(1, "week").week() + 1 : time.week();
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
    case Unit.Weekday:
      return time.weekday();
    case Unit.WeekOfMonth:
      return getWeek(time) - getWeek(time.startOf("M")) + 1;
    case Unit.WeekOfYear:
      return getWeek(time);
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

export function manipulateTimeByUnit(time: Dayjs, unit: Unit, value: number): Dayjs {
  switch (unit) {
    case Unit.Sec:
      return time.second(value);
    case Unit.Min:
      return time.minute(value);
    case Unit.Hour:
      return time.hour(value);
    case Unit.Day:
      return time.date(value);
    case Unit.Weekday:
      return time.weekday(value);
    case Unit.WeekOfMonth:
      const currentWeekday = time.weekday();

      return time.week(getWeek(time.startOf("M")) + value - 1).weekday(currentWeekday);
    case Unit.WeekOfYear:
      return time.week(value);
    case Unit.Month:
      return time.month(value - 1);
    case Unit.Year:
      return time.year(value);
  }
}

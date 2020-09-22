import dayjs, { Dayjs, OpUnitType } from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekday from "dayjs/plugin/weekday";

dayjs.extend(weekOfYear);
dayjs.extend(weekday);

enum Unit {
  Year,
  Month,
  Day,
  Hour,
  Min,
  Sec,
  WeekOfYear,
  Weekday,
  WeekOfMonth,
}

function isWeek(expression: string) {
  return expression.indexOf("/") !== -1;
}

function isWeekOfYear(blocks: string[]) {
  return blocks.length === 5;
}

const validateRules = {
  [Unit.Year]: undefined,
  [Unit.Month]: [1, 12],
  [Unit.Day]: [1, 31],
  [Unit.Hour]: [0, 23],
  [Unit.Min]: [0, 59],
  [Unit.Sec]: [0, 59],
  [Unit.WeekOfYear]: [1, 52],
  [Unit.WeekOfMonth]: [1, 4],
  [Unit.Weekday]: [0, 6],
};

function validateRange(start: number, end: number, type: Unit) {
  if (isNaN(start) || isNaN(end)) {
    return false;
  }

  const rule = validateRules[type];

  if (rule == null) {
    return true;
  }

  const [startRule, endRule] = rule;

  return start >= startRule && end <= endRule;
}

function parseRange(range: string, type: Unit): Range[] {
  if (range === "*") {
    return [];
  }

  const rangeArray = range.split(",");

  return rangeArray.map((item) => {
    const [startString, endString] = item.split("-");
    const start = parseInt(startString);
    const end = parseInt(endString);

    if (!validateRange(start, end, type)) {
      throw new Error(`Invalid range ${start}-${end} in`);
    }

    return { start, end };
  });
}

function parseBlocks(options: {
  period: string;
  year: string;
  month?: string;
  weekOfYear?: string;
  weekOfMonth?: string;
  weekday?: string;
  day?: string;
  hour: string;
  min: string;
  sec: string;
}) {
  const { period, year, month, weekOfYear, weekOfMonth, weekday, day, hour, min, sec } = options;
  const parsedYear = parseRange(year, Unit.Year);
  const parsedMonth = month != null ? parseRange(month, Unit.Month) : undefined;
  const parsedWeekOfYear = weekOfYear != null ? parseRange(weekOfYear, Unit.WeekOfYear) : undefined;
  const parsedWeekOfMonth = weekOfMonth != null ? parseRange(weekOfMonth, Unit.WeekOfMonth) : undefined;
  const parsedWeekday = weekday != null ? parseRange(weekday, Unit.Weekday) : undefined;
  const parsedDay = day != null ? parseRange(day, Unit.Day) : undefined;
  const parsedHour = parseRange(hour, Unit.Hour);
  const parsedMin = parseRange(min, Unit.Min);
  const parsedSec = parseRange(sec, Unit.Sec);

  return {
    period,
    year: parsedYear,
    month: parsedMonth,
    weekOfYear: parsedWeekOfYear,
    weekOfMonth: parsedWeekOfMonth,
    weekday: parsedWeekday,
    day: parsedDay,
    hour: parsedHour,
    min: parsedMin,
    sec: parsedSec,
  };
}

function getPeriodByUnit(period: string, unit: Unit): { periodNumber: number; opUnit: OpUnitType } {
  const [dateSection, timeSection = ""] = period.replace("P", "").split("T");
  let result;
  let opUnit: OpUnitType;

  switch (unit) {
    case Unit.Sec:
      result = timeSection.match(/(\d+)[s]/i);
      opUnit = "second";
      break;
    case Unit.Min:
      result = timeSection.match(/(\d+)[m]/i);
      opUnit = "minute";
      break;
    case Unit.Hour:
      result = timeSection.match(/(\d+)[h]/i);
      opUnit = "hour";
      break;
    case Unit.Day:
    case Unit.Weekday:
    case Unit.WeekOfMonth:
    case Unit.WeekOfYear:
      result = dateSection.match(/(\d+)[d]/i);
      opUnit = "day";
      break;
    case Unit.Month:
      result = dateSection.match(/(\d+)[m]/i);
      opUnit = "month";
      break;
    case Unit.Year:
      result = dateSection.match(/(\d+)[y]/i);
      opUnit = "year";
      break;
  }

  if (result) {
    return { periodNumber: parseInt(result[1]), opUnit };
  } else {
    return { periodNumber: NaN, opUnit };
  }
}

function moveToStartOrEndOfRage(time: Dayjs, unit: Unit, range: Range, isNext: boolean) {
  const edge = isNext ? range.start : range.end;

  switch (unit) {
    case Unit.Sec:
      return time.second(edge);
    case Unit.Min:
      return time.minute(edge);
    case Unit.Hour:
      return time.hour(edge);
    case Unit.Day:
      return time.date(edge);
    case Unit.Weekday:
      return time.weekday(edge);
    case Unit.WeekOfMonth:
      const currentWeekday = time.weekday();
      return time.startOf("month").week(edge).weekday(currentWeekday);
    case Unit.WeekOfYear:
      return time.week(edge);
    case Unit.Month:
      return time.month(edge);
    case Unit.Year:
      return time.year(edge);
  }
}

function getOffsetByRanges(num: number, ranges: Range[]) {
  let rangeIndex = 0;
  let inRange = false;

  for (let i = 0; i < ranges.length; i++) {
    rangeIndex = i;

    const range = ranges[i];
    const prevRange = ranges[i - 1];

    if (num >= range.start && num <= range.end) {
      inRange = true;

      break;
    } else if (prevRange != null && num > prevRange.end && num < range.start) {
      break;
    }
  }

  return { rangeIndex, inRange };
}

function getStartOrEndTimeOfNextRange(
  unit: Unit,
  currentTime: Dayjs,
  options: Options,
  ranges: Range[],
  rangeIndex: number,
  isNext: boolean
): Dayjs | null {
  const { weekOfMonth: weekOfMonthRanges, day: dayRanges } = options;
  const nextRange = ranges[rangeIndex + 1];

  if (nextRange != null) {
    return moveToStartOrEndOfRage(currentTime, unit, nextRange, isNext);
  } else {
    let nextUnit;

    switch (unit) {
      case Unit.Sec:
        nextUnit = Unit.Min;
        break;
      case Unit.Min:
        nextUnit = Unit.Hour;
        break;
      case Unit.Hour:
        nextUnit = dayRanges != null ? Unit.Day : Unit.Weekday;
        break;
      case Unit.Day:
        nextUnit = Unit.Month;
        break;
      case Unit.Weekday:
        nextUnit = weekOfMonthRanges != null ? Unit.WeekOfMonth : Unit.WeekOfYear;
        break;
      case Unit.WeekOfMonth:
        nextUnit = Unit.Year;
        break;
      case Unit.WeekOfYear:
        nextUnit = Unit.Year;
        break;
      case Unit.Month:
        nextUnit = Unit.Year;
        break;
      case Unit.Year:
        return null;
    }

    if (nextUnit) {
      const newTime = getNextOrPrevTime(nextUnit, currentTime, options, isNext);

      const nextRange = isNext ? ranges[0] : ranges[ranges.length - 1];

      if (newTime != null && nextRange) {
        return moveToStartOrEndOfRage(newTime, unit, nextRange, isNext);
      }
    }
  }

  return null;
}

function getValueByUnit(time: Dayjs, unit: Unit) {
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
      return parseInt(time.format("w")) - parseInt(time.startOf("M").format("w")) + 1;
    case Unit.WeekOfYear:
      return time.week();
    case Unit.Month:
      return time.month();
    case Unit.Year:
      return time.year();
  }
}

function getRangesByUnit(options: Options, unit: Unit) {
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
      return weekday;
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

function getNextOrPrevTime(unit: Unit, currentTime: Dayjs, options: Options, isNext = true): Dayjs | null {
  let newTime: Dayjs | null = currentTime;
  const { period } = options;

  const value = getValueByUnit(currentTime, unit);
  const ranges = getRangesByUnit(options, unit);

  if (ranges && ranges.length) {
    const { rangeIndex, inRange } = getOffsetByRanges(value, ranges);

    if (!inRange) {
      // out of range, move to the begining of next range

      newTime = getStartOrEndTimeOfNextRange(unit, currentTime, options, ranges, rangeIndex, isNext);
    } else {
      // in range, move to next period and do out of range checking
      const { periodNumber, opUnit } = getPeriodByUnit(period, unit);
      newTime = isNext ? currentTime.add(periodNumber, opUnit) : currentTime.subtract(periodNumber, opUnit);

      // if out of range, move to the begining of next range
      const newValue = getValueByUnit(newTime, unit);
      const { rangeIndex: newValueRangeIndex, inRange: newValueInRange } = getOffsetByRanges(newValue, ranges);

      if (!newValueInRange) {
        // out of range, move to the begining of next range

        newTime = getStartOrEndTimeOfNextRange(unit, newTime, options, ranges, newValueRangeIndex, isNext);
      }
    }
  }

  return newTime;
}

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

class Result {
  private options: Options;
  private originalTimestamp: number;
  private currentTime: Dayjs;
  private hasPrev = true;
  private hasNext = true;

  constructor(options: Options, timestamp: number) {
    this.options = options;
    this.originalTimestamp = timestamp;
    this.currentTime = dayjs.unix(timestamp);
  }

  reset() {
    this.currentTime = dayjs.unix(this.originalTimestamp);
  }

  prev() {
    if (!this.hasPrev) {
      return null;
    }

    const newTime = getNextOrPrevTime(Unit.Sec, this.currentTime, this.options);

    this.hasPrev = newTime != null;

    if (newTime != null) {
      this.currentTime = newTime;
    }

    return newTime;
  }

  next() {
    if (!this.hasNext) {
      return null;
    }

    const newTime = getNextOrPrevTime(Unit.Sec, this.currentTime, this.options, true);

    this.hasNext = newTime != null;

    if (newTime != null) {
      this.currentTime = newTime;
    }

    return newTime;
  }
}

export function parseExpression(expression: string, timestamp: number) {
  const blocks = expression.split(" ");
  let options: Options;

  if (isWeek(expression)) {
    if (isWeekOfYear(blocks)) {
      const [period, year, weekOfYear, hour, min, sec] = blocks;
      const [week, weekday] = weekOfYear.split("/");

      options = parseBlocks({ period, year, weekOfYear: week, weekday, hour, min, sec });
    } else {
      const [period, year, month, weekOfMonth, hour, min, sec] = blocks;
      const [week, weekday] = weekOfMonth.split("/");

      options = parseBlocks({ period, year, month, weekOfMonth: week, weekday, hour, min, sec });
    }
  } else {
    const [period, year, month, day, hour, min, sec] = expression.split(" ");

    options = parseBlocks({ period, year, month, day, hour, min, sec });
  }

  return new Result(options, timestamp);
}

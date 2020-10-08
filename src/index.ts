import dayjs, { Dayjs } from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import advancedFormat from "dayjs/plugin/advancedFormat";
import weekday from "dayjs/plugin/weekday";
import {
  Range,
  Options,
  Unit,
  getPrevUnit,
  getNextUnit,
  getPeriodByUnit,
  validateRange,
  transformUnitToDayjsUnit,
  getRangesByUnit,
  getValueByUnit,
  withDefaultRanges,
  getRangeInfo,
  isWeek,
  manipulateTimeByUnit,
  isWeekOfYear,
} from "./utils";

dayjs.extend(weekday);
dayjs.extend(weekOfYear);
dayjs.extend(advancedFormat);

function parseRange(range: string, type: Unit): Range[] {
  if (range === "*") {
    return [];
  }

  const rangeArray = range.split(",");

  return rangeArray
    .map((item) => {
      const [startString, endString] = item.split("-");
      const start = parseInt(startString);
      const end = endString != null ? parseInt(endString) : start;

      if (!validateRange(start, end, type)) {
        throw new Error(`Invalid range ${start}-${end} in`);
      }

      return { start, end };
    })
    .sort((a, b) => a.start - b.start);
}

function parseBlocks(options: { period: string; year: string; month?: string; weekOfYear?: string; weekOfMonth?: string; weekday?: string; day?: string; hour: string; min: string; sec: string }) {
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

function addOrSubtractDuration(time: Dayjs, duration: number, unit: Unit, isNext: boolean) {
  const opUnit = transformUnitToDayjsUnit(unit);

  return isNext ? time.add(duration, opUnit) : time.subtract(duration, opUnit);
}

function getEdgeOfRange(value: number, range: Range, periodNumber: number, isNext: boolean) {
  if (!isNext && periodNumber === 0) {
    return value;
  }

  const edge = isNext ? range.start : range.end - ((range.end - range.start) % periodNumber);

  return edge;
}

function getDurationByPeriodAndValue(value: number, periodNumber: number, range: Range, isNext: boolean) {
  if (isNext) {
    return periodNumber;
  } else {
    if (periodNumber === 0) {
      return periodNumber;
    } else {
      const mod = (value - range.start) % periodNumber;

      return mod === 0 ? periodNumber : mod;
    }
  }
}

function moveToNextRangeByUnit(unit: Unit, time: Dayjs, ranges: Range[], rangeIndex: number, options: Options, isNext: boolean) {
  let nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
  let needToCarry = false;

  if (nextRangeIndex > ranges.length - 1) {
    nextRangeIndex = 0;
    needToCarry = true;
  } else if (nextRangeIndex < 0) {
    nextRangeIndex = ranges.length - 1;
    needToCarry = true;
  }

  let newTime = time;
  const prevUnit = getPrevUnit(unit, options);

  if (needToCarry) {
    if (prevUnit == null) {
      return null;
    } else {
      const prevUnitValue = getValueByUnit(newTime, prevUnit);
      newTime = manipulateTimeByUnit(newTime, prevUnit, prevUnitValue + 1);
    }
  }

  const { period } = options;
  const periodNumber = getPeriodByUnit(period, unit);
  const value = getValueByUnit(newTime, unit);
  const newRanges = withDefaultRanges(unit, getRangesByUnit(unit, newTime, options));

  if (newRanges != null) {
    const nextRange = newRanges[nextRangeIndex];
    const currentUnitEdge = getEdgeOfRange(value, nextRange, periodNumber, isNext);

    newTime = manipulateTimeByUnit(newTime, unit, currentUnitEdge);
  }

  const nextUnits = [];
  let nextUnit: Unit | null = unit;

  while (nextUnit != null) {
    nextUnit = getNextUnit(nextUnit, options);

    if (nextUnit != null) {
      nextUnits.push(nextUnit);
    }
  }

  nextUnits.forEach((nextUnit) => {
    const nextUnitRanges = withDefaultRanges(nextUnit, getRangesByUnit(nextUnit, newTime, options));

    if (nextUnitRanges != null) {
      const nextUnitRange = isNext ? nextUnitRanges[0] : nextUnitRanges[nextUnitRanges.length - 1];
      const nextUnitPeriodNumber = getPeriodByUnit(period, nextUnit);

      const nextUnitValue = getValueByUnit(newTime, nextUnit);
      const nextUnitEdge = getEdgeOfRange(nextUnitValue, nextUnitRange, nextUnitPeriodNumber, isNext);

      newTime = manipulateTimeByUnit(newTime, nextUnit, nextUnitEdge);
    }
  });

  return newTime;
}

function moveIntoRangeByUnit(unit: Unit, time: Dayjs, options: Options, isNext: boolean): Dayjs | null {
  const value = getValueByUnit(time, unit);
  const ranges = withDefaultRanges(unit, getRangesByUnit(unit, time, options));

  if (ranges) {
    if (ranges.length) {
      const { rangeIndex, inRange } = getRangeInfo(value, ranges, isNext);

      if (!inRange) {
        return moveToNextRangeByUnit(unit, time, ranges, rangeIndex, options, isNext);
      }
    }
  }

  return time;
}

function moveIntoRangeRecursively(unit: Unit, time: Dayjs, options: Options, isNext: boolean): Dayjs | null {
  const newTime = moveIntoRangeByUnit(unit, time, options, isNext);

  if (newTime == null) {
    return null;
  }

  const prevUnit = getPrevUnit(unit, options);

  if (prevUnit) {
    return moveIntoRangeRecursively(prevUnit, newTime, options, isNext);
  } else {
    return newTime;
  }
}

function moveToNextPeriodRecursively(unit: Unit, time: Dayjs, options: Options, isNext: boolean): Dayjs {
  const { period } = options;
  const periodNumber = getPeriodByUnit(period, unit);
  const value = getValueByUnit(time, unit);
  const ranges = withDefaultRanges(unit, getRangesByUnit(unit, time, options));

  let newTime = time;

  if (ranges) {
    if (ranges.length) {
      const { rangeIndex } = getRangeInfo(value, ranges, isNext);
      const range = ranges[rangeIndex];
      const duration = getDurationByPeriodAndValue(value, periodNumber, range, isNext);

      newTime = addOrSubtractDuration(newTime, duration, unit, isNext);
    }
  }

  const prevUnit = getPrevUnit(unit, options);

  if (prevUnit) {
    return moveToNextPeriodRecursively(prevUnit, newTime, options, isNext);
  } else {
    return newTime;
  }
}

function moveToNextPeriod(time: Dayjs, options: Options, isNext: boolean) {
  const timeMustBeInRange = moveIntoRangeRecursively(Unit.Sec, time, options, isNext);

  if (timeMustBeInRange == null || !time.isSame(timeMustBeInRange)) {
    return timeMustBeInRange;
  }

  const timeAfterPeriodIncreased = moveToNextPeriodRecursively(Unit.Sec, timeMustBeInRange, options, isNext);

  return moveIntoRangeRecursively(Unit.Sec, timeAfterPeriodIncreased, options, isNext);
}

class Result {
  private options: Options;
  private originalTimestamp: number;
  private currentTime: Dayjs;
  private hasPrev = true;
  private hasNext = true;

  constructor(options: Options, timestamp = dayjs().unix()) {
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

    if (!this.hasNext) {
      this.hasNext = true;

      return this.currentTime;
    }

    const newTime = moveToNextPeriod(this.currentTime, this.options, false);

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

    if (!this.hasPrev) {
      this.hasPrev = true;

      return this.currentTime;
    }

    const newTime = moveToNextPeriod(this.currentTime, this.options, true);

    this.hasNext = newTime != null;

    if (newTime != null) {
      this.currentTime = newTime;
    }

    return newTime;
  }
}

export function parseExpression(expression: string, timestamp?: number) {
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

export default parseExpression;

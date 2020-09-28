import dayjs, { Dayjs } from "dayjs";
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
} from "./utils";

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

function parseBlocks(options: { period: string; year: string; month?: string; day?: string; hour: string; min: string; sec: string }) {
  const { period, year, month, day, hour, min, sec } = options;
  const parsedYear = parseRange(year, Unit.Year);
  const parsedMonth = month != null ? parseRange(month, Unit.Month) : undefined;
  const parsedDay = day != null ? parseRange(day, Unit.Day) : undefined;
  const parsedHour = parseRange(hour, Unit.Hour);
  const parsedMin = parseRange(min, Unit.Min);
  const parsedSec = parseRange(sec, Unit.Sec);

  return {
    period,
    year: parsedYear,
    month: parsedMonth,
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

function moveToStartOrEndOfRange(unit: Unit, time: Dayjs, range: Range, periodNumber: number, isNext: boolean) {
  if (!isNext && periodNumber === 0) {
    return time;
  }

  const edge = isNext ? range.start : range.end - ((range.end - range.start) % periodNumber);

  switch (unit) {
    case Unit.Sec:
      return time.second(edge);
    case Unit.Min:
      return time.minute(edge);
    case Unit.Hour:
      return time.hour(edge);
    case Unit.Day:
      return time.date(edge);
    case Unit.Month:
      return time.month(edge - 1);
    case Unit.Year:
      return time.year(edge);
  }
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

function moveToNextPeriodByUnit(unit: Unit, time: Dayjs, options: Options, isNext: boolean, onlyChecking: boolean): Dayjs | null {
  const { period } = options;
  const periodNumber = getPeriodByUnit(period, unit);
  const value = getValueByUnit(time, unit);
  const ranges = withDefaultRanges(unit, getRangesByUnit(options, unit));

  if (ranges) {
    if (ranges.length) {
      const { rangeIndex, inRange } = getRangeInfo(value, ranges, isNext);

      if (inRange) {
        if (!onlyChecking) {
          const range = ranges[rangeIndex];
          const duration = getDurationByPeriodAndValue(value, periodNumber, range, isNext);
          const newTime = addOrSubtractDuration(time, duration, unit, isNext);
          return moveToNextPeriodByUnit(unit, newTime, options, isNext, true);
        }
      } else {
        let nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
        let needToCarry = false;

        if (nextRangeIndex > ranges.length - 1) {
          nextRangeIndex = 0;
          needToCarry = true;
        } else if (nextRangeIndex < 0) {
          nextRangeIndex = ranges.length - 1;
          needToCarry = true;
        }

        const nextRange = ranges[nextRangeIndex];
        const newTimeWithCurrentUnit = moveToStartOrEndOfRange(unit, time, nextRange, periodNumber, isNext);
        const nextUnits = [];
        let nextUnit: Unit | null = unit;

        while (nextUnit != null) {
          nextUnit = getNextUnit(nextUnit);

          if (nextUnit != null) {
            nextUnits.push(nextUnit);
          }
        }

        let newTimeWithNextUnit = newTimeWithCurrentUnit;

        nextUnits.forEach((nextUnit) => {
          const nextUnitRanges = withDefaultRanges(nextUnit, getRangesByUnit(options, nextUnit));

          if (nextUnitRanges != null) {
            const nextUnitRange = isNext ? nextUnitRanges[0] : nextUnitRanges[nextUnitRanges.length - 1];
            const nextUnitPeriodNumber = getPeriodByUnit(period, nextUnit);

            newTimeWithNextUnit = moveToStartOrEndOfRange(nextUnit, newTimeWithNextUnit, nextUnitRange, nextUnitPeriodNumber, isNext);
          }
        });

        const prevUnit = getPrevUnit(unit);

        return needToCarry ? (prevUnit == null ? null : addOrSubtractDuration(newTimeWithNextUnit, 1, prevUnit, isNext)) : newTimeWithNextUnit;
      }
    }
  }

  return time;
}

function moveToNextPeriodRecursively(unit: Unit, time: Dayjs, options: Options, isNext: boolean): Dayjs | null {
  const newTime = moveToNextPeriodByUnit(unit, time, options, isNext, false);

  if (newTime == null) {
    return null;
  }

  const preUnit = getPrevUnit(unit);

  if (preUnit) {
    return moveToNextPeriodRecursively(preUnit, newTime, options, isNext);
  } else {
    return newTime;
  }
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

    const newTime = moveToNextPeriodRecursively(Unit.Sec, this.currentTime, this.options, false);

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

    const newTime = moveToNextPeriodRecursively(Unit.Sec, this.currentTime, this.options, true);

    this.hasNext = newTime != null;

    if (newTime != null) {
      this.currentTime = newTime;
    }

    return newTime;
  }
}

export function parseExpression(expression: string, timestamp?: number) {
  const blocks = expression.split(" ");

  const [period, year, month, day, hour, min, sec] = expression.split(" ");

  const options = parseBlocks({ period, year, month, day, hour, min, sec });

  return new Result(options, timestamp);
}

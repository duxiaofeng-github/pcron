import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import weekday from 'dayjs/plugin/weekday';
import advancedFormat from 'dayjs/plugin/advancedFormat';

dayjs.extend(weekOfYear);
dayjs.extend(weekday);
dayjs.extend(advancedFormat);
var Unit;

(function (Unit) {
  Unit["Year"] = "year";
  Unit["Month"] = "month";
  Unit["Day"] = "day";
  Unit["Hour"] = "hour";
  Unit["Min"] = "minute";
  Unit["Sec"] = "second";
  Unit["WeekOfYear"] = "weekOfYear";
  Unit["Weekday"] = "weekday";
  Unit["WeekOfMonth"] = "weekOfMonth";
})(Unit || (Unit = {}));

function isWeek(expression) {
  return expression.indexOf("/") !== -1;
}

function isWeekOfYear(blocks) {
  return blocks.length === 6;
}

const defaultRanges = {
  [Unit.Year]: undefined,
  [Unit.Month]: [1, 12],
  [Unit.Day]: [1, 31],
  [Unit.Hour]: [0, 23],
  [Unit.Min]: [0, 59],
  [Unit.Sec]: [0, 59],
  [Unit.WeekOfYear]: [1, 52],
  [Unit.WeekOfMonth]: [1, 4],
  [Unit.Weekday]: [0, 6]
};

function getFullRange(unit) {
  const range = defaultRanges[unit];
  return range ? [{
    start: range[0],
    end: range[1]
  }] : undefined;
}

function validateRange(start, end, type) {
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

function parseRange(range, type) {
  if (range === "*") {
    return [];
  }

  const rangeArray = range.split(",");
  return rangeArray.map(item => {
    const [startString, endString] = item.split("-");
    const start = parseInt(startString);
    const end = endString != null ? parseInt(endString) : start;

    if (!validateRange(start, end, type)) {
      throw new Error(`Invalid range ${start}-${end} in`);
    }

    return {
      start,
      end
    };
  }).sort((a, b) => a.start - b.start);
}

function parseBlocks(options) {
  const {
    period,
    year,
    month,
    weekOfYear,
    weekOfMonth,
    weekday,
    day,
    hour,
    min,
    sec
  } = options;
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
    sec: parsedSec
  };
}

function transformUnitToDayjsUnit(unit) {
  switch (unit) {
    case Unit.Sec:
      return "second";

    case Unit.Min:
      return "minute";

    case Unit.Hour:
      return "hour";

    case Unit.Day:
      return "day";

    case Unit.Weekday:
      return "day";

    case Unit.WeekOfMonth:
      return "week";

    case Unit.WeekOfYear:
      return "week";

    case Unit.Month:
      return "month";

    case Unit.Year:
      return "year";
  }
}

function moveToStartOrEndOfRange(unit, time, range, isNext) {
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
      return time.month(edge - 1);

    case Unit.Year:
      return time.year(edge);
  }
}

function getPrevUnit(unit, options) {
  const {
    weekOfMonth: weekOfMonthRanges,
    day: dayRanges
  } = options;

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
      return Unit.Year;

    case Unit.WeekOfYear:
      return Unit.Year;

    case Unit.Month:
      return Unit.Year;

    case Unit.Year:
      return null;
  }
}

function getNextUnit(unit, options) {
  const {
    weekOfYear: weekOfYearRanges,
    weekOfMonth: weekOfMonthRanges
  } = options;

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

function getPeriodByUnit(period, unit) {
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

function addOrSubtractPeriod(time, period, unit, isNext) {
  const opUnit = transformUnitToDayjsUnit(unit);
  return isNext ? time.add(period, opUnit) : time.subtract(period, opUnit);
}

function moveToNextPeriodByUnit(unit, time, options, isNext, onlyChecking) {
  const value = getValueByUnit(time, unit);
  const ranges = withDefaultRanges(unit, getRangesByUnit(options, unit));

  if (ranges) {
    if (ranges.length) {
      const {
        rangeIndex,
        inRange
      } = getRangeInfo(value, ranges, isNext);

      if (inRange) {
        if (!onlyChecking) {
          const {
            period
          } = options;
          const periodNumber = getPeriodByUnit(period, unit);
          const newTime = addOrSubtractPeriod(time, periodNumber, unit, isNext);
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
        const newTimeWithCurrentUnit = moveToStartOrEndOfRange(unit, time, nextRange, isNext);
        const nextUnits = [];
        let nextUnit = unit;

        while (nextUnit != null) {
          nextUnit = getNextUnit(nextUnit, options);

          if (nextUnit != null) {
            nextUnits.push(nextUnit);
          }
        }

        let newTimeWithNextUnit = newTimeWithCurrentUnit;
        nextUnits.forEach(nextUnit => {
          const nextUnitRanges = withDefaultRanges(nextUnit, getRangesByUnit(options, nextUnit));

          if (nextUnitRanges != null) {
            const nextUnitRange = isNext ? nextUnitRanges[0] : nextUnitRanges[nextUnitRanges.length - 1];
            newTimeWithNextUnit = moveToStartOrEndOfRange(nextUnit, newTimeWithNextUnit, nextUnitRange, isNext);
          }
        });

        if (needToCarry) {
          const prevUnit = getPrevUnit(unit, options);

          if (prevUnit == null) {
            return {
              newTime: null,
              inRange
            };
          } else {
            const newTimeWithPrevUnit = addOrSubtractPeriod(newTimeWithNextUnit, 1, prevUnit, isNext);
            return {
              newTime: moveToNextPeriodByUnit(prevUnit, newTimeWithPrevUnit, options, isNext, true).newTime,
              inRange
            };
          }
        } else {
          return {
            newTime: newTimeWithNextUnit,
            inRange
          };
        }
      }
    } else {
      const {
        period
      } = options;
      const periodNumber = getPeriodByUnit(period, unit);
      return {
        newTime: addOrSubtractPeriod(time, periodNumber, unit, isNext),
        inRange: true
      };
    }
  }

  return {
    newTime: time,
    inRange: true
  };
}

function getRangeInfo(num, ranges, isNext) {
  let rangeIndex = isNext ? -1 : ranges.length;
  let inRange = false;

  for (let i = 0; i < ranges.length; i++) {
    const nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
    const nextRange = ranges[nextRangeIndex];

    if (num >= nextRange.start) {
      rangeIndex = nextRangeIndex;
    }

    if (num >= nextRange.start && num <= nextRange.end) {
      inRange = true;
      break;
    }
  }

  return {
    rangeIndex,
    inRange
  };
}

function getValueByUnit(time, unit) {
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
      return time.month() + 1;

    case Unit.Year:
      return time.year();
  }
}

function withDefaultRanges(unit, ranges) {
  if (ranges == null) {
    return undefined;
  }

  if (ranges.length === 0) {
    return getFullRange(unit) || [];
  }

  return ranges;
}

function getRangesByUnit(options, unit) {
  const {
    year,
    month,
    weekOfYear,
    weekOfMonth,
    weekday,
    day,
    hour,
    min,
    sec
  } = options;

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

function moveToNextPeriodRecursively(unit, time, options, isNext) {
  const {
    newTime,
    inRange
  } = moveToNextPeriodByUnit(unit, time, options, isNext, false);

  if (newTime == null) {
    return null;
  }

  if (!inRange) {
    return newTime;
  }

  const nextUnit = getNextUnit(unit, options);

  if (nextUnit) {
    return moveToNextPeriodRecursively(nextUnit, newTime, options, isNext);
  } else {
    return newTime;
  }
}

function moveToNextPeriod(time, options, isNext) {
  return moveToNextPeriodRecursively(Unit.Year, time, options, isNext);
}

class Result {
  constructor(options, timestamp = dayjs().unix()) {
    this.hasPrev = true;
    this.hasNext = true;
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

function parseExpression(expression, timestamp) {
  const blocks = expression.split(" ");
  let options;

  if (isWeek(expression)) {
    if (isWeekOfYear(blocks)) {
      const [period, year, weekOfYear, hour, min, sec] = blocks;
      const [week, weekday] = weekOfYear.split("/");
      options = parseBlocks({
        period,
        year,
        weekOfYear: week,
        weekday,
        hour,
        min,
        sec
      });
    } else {
      const [period, year, month, weekOfMonth, hour, min, sec] = blocks;
      const [week, weekday] = weekOfMonth.split("/");
      options = parseBlocks({
        period,
        year,
        month,
        weekOfMonth: week,
        weekday,
        hour,
        min,
        sec
      });
    }
  } else {
    const [period, year, month, day, hour, min, sec] = expression.split(" ");
    options = parseBlocks({
      period,
      year,
      month,
      day,
      hour,
      min,
      sec
    });
  }

  return new Result(options, timestamp);
}

export { parseExpression };

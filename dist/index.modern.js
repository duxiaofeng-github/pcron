import dayjs from 'dayjs';

var Unit;

(function (Unit) {
  Unit["Year"] = "year";
  Unit["Month"] = "month";
  Unit["Day"] = "day";
  Unit["Hour"] = "hour";
  Unit["Min"] = "minute";
  Unit["Sec"] = "second";
})(Unit || (Unit = {}));

const defaultRanges = {
  [Unit.Year]: [-10000, 10000],
  [Unit.Month]: [1, 12],
  [Unit.Day]: [1, 31],
  [Unit.Hour]: [0, 23],
  [Unit.Min]: [0, 59],
  [Unit.Sec]: [0, 59]
};

function getDefaultRange(unit) {
  const range = defaultRanges[unit];
  return [{
    start: range[0],
    end: range[1]
  }];
}

function getPrevUnit(unit) {
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
function getNextUnit(unit) {
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

    case Unit.Month:
      return "month";

    case Unit.Year:
      return "year";
  }
}
function getRangesByUnit(options, unit) {
  const {
    year,
    month,
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

    case Unit.Month:
      return month;

    case Unit.Year:
      return year;
  }
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
    return getDefaultRange(unit);
  }

  return ranges;
}
function getRangeInfo(num, ranges, isNext) {
  let rangeIndex = isNext ? -1 : ranges.length;
  let inRange = false;

  for (let i = 0; i < ranges.length; i++) {
    const nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
    const nextRange = ranges[nextRangeIndex];

    if (isNext && num >= nextRange.start || !isNext && num <= nextRange.end) {
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
    day,
    hour,
    min,
    sec
  } = options;
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
    sec: parsedSec
  };
}

function addOrSubtractDuration(time, duration, unit, isNext) {
  const opUnit = transformUnitToDayjsUnit(unit);
  return isNext ? time.add(duration, opUnit) : time.subtract(duration, opUnit);
}

function moveToStartOrEndOfRange(unit, time, range, periodNumber, isNext) {
  if (!isNext && periodNumber === 0) {
    return time;
  }

  const edge = isNext ? range.start : range.end - (range.end - range.start) % periodNumber;

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

function getDurationByPeriodAndValue(value, periodNumber, range, isNext) {
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

function moveToNextPeriodByUnit(unit, time, options, isNext, onlyChecking) {
  const {
    period
  } = options;
  const periodNumber = getPeriodByUnit(period, unit);
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
        let nextUnit = unit;

        while (nextUnit != null) {
          nextUnit = getNextUnit(nextUnit);

          if (nextUnit != null) {
            nextUnits.push(nextUnit);
          }
        }

        let newTimeWithNextUnit = newTimeWithCurrentUnit;
        nextUnits.forEach(nextUnit => {
          const nextUnitRanges = withDefaultRanges(nextUnit, getRangesByUnit(options, nextUnit));

          if (nextUnitRanges != null) {
            const nextUnitRange = isNext ? nextUnitRanges[0] : nextUnitRanges[nextUnitRanges.length - 1];
            const nextUnitPeriodNumber = getPeriodByUnit(period, nextUnit);
            newTimeWithNextUnit = moveToStartOrEndOfRange(nextUnit, newTimeWithNextUnit, nextUnitRange, nextUnitPeriodNumber, isNext);
          }
        });
        const prevUnit = getPrevUnit(unit);
        return needToCarry ? prevUnit == null ? null : addOrSubtractDuration(newTimeWithNextUnit, 1, prevUnit, isNext) : newTimeWithNextUnit;
      }
    }
  }

  return time;
}

function moveToNextPeriodRecursively(unit, time, options, isNext) {
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

function parseExpression(expression, timestamp) {
  const blocks = expression.split(" ");
  const [period, year, month, day, hour, min, sec] = expression.split(" ");
  const options = parseBlocks({
    period,
    year,
    month,
    day,
    hour,
    min,
    sec
  });
  return new Result(options, timestamp);
}

export { parseExpression };

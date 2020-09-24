function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var dayjs = _interopDefault(require('dayjs'));
var weekOfYear = _interopDefault(require('dayjs/plugin/weekOfYear'));
var weekday = _interopDefault(require('dayjs/plugin/weekday'));
var advancedFormat = _interopDefault(require('dayjs/plugin/advancedFormat'));

var _defaultRanges;
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

var defaultRanges = (_defaultRanges = {}, _defaultRanges[Unit.Year] = undefined, _defaultRanges[Unit.Month] = [1, 12], _defaultRanges[Unit.Day] = [1, 31], _defaultRanges[Unit.Hour] = [0, 23], _defaultRanges[Unit.Min] = [0, 59], _defaultRanges[Unit.Sec] = [0, 59], _defaultRanges[Unit.WeekOfYear] = [1, 52], _defaultRanges[Unit.WeekOfMonth] = [1, 4], _defaultRanges[Unit.Weekday] = [0, 6], _defaultRanges);

function getFullRange(unit) {
  var range = defaultRanges[unit];
  return range ? [{
    start: range[0],
    end: range[1]
  }] : undefined;
}

function validateRange(start, end, type) {
  if (isNaN(start) || isNaN(end)) {
    return false;
  }

  var range = defaultRanges[type];

  if (range == null) {
    return true;
  }

  var startEdge = range[0],
      endEdge = range[1];
  return start >= startEdge && end <= endEdge;
}

function parseRange(range, type) {
  if (range === "*") {
    return [];
  }

  var rangeArray = range.split(",");
  return rangeArray.map(function (item) {
    var _item$split = item.split("-"),
        startString = _item$split[0],
        endString = _item$split[1];

    var start = parseInt(startString);
    var end = endString != null ? parseInt(endString) : start;

    if (!validateRange(start, end, type)) {
      throw new Error("Invalid range " + start + "-" + end + " in");
    }

    return {
      start: start,
      end: end
    };
  }).sort(function (a, b) {
    return a.start - b.start;
  });
}

function parseBlocks(options) {
  var period = options.period,
      year = options.year,
      month = options.month,
      weekOfYear = options.weekOfYear,
      weekOfMonth = options.weekOfMonth,
      weekday = options.weekday,
      day = options.day,
      hour = options.hour,
      min = options.min,
      sec = options.sec;
  var parsedYear = parseRange(year, Unit.Year);
  var parsedMonth = month != null ? parseRange(month, Unit.Month) : undefined;
  var parsedWeekOfYear = weekOfYear != null ? parseRange(weekOfYear, Unit.WeekOfYear) : undefined;
  var parsedWeekOfMonth = weekOfMonth != null ? parseRange(weekOfMonth, Unit.WeekOfMonth) : undefined;
  var parsedWeekday = weekday != null ? parseRange(weekday, Unit.Weekday) : undefined;
  var parsedDay = day != null ? parseRange(day, Unit.Day) : undefined;
  var parsedHour = parseRange(hour, Unit.Hour);
  var parsedMin = parseRange(min, Unit.Min);
  var parsedSec = parseRange(sec, Unit.Sec);
  return {
    period: period,
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
  var edge = isNext ? range.start : range.end;

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
      var currentWeekday = time.weekday();
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
  var weekOfMonthRanges = options.weekOfMonth,
      dayRanges = options.day;

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
  var weekOfYearRanges = options.weekOfYear,
      weekOfMonthRanges = options.weekOfMonth;

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
  var _period$replace$split = period.replace("P", "").split("T"),
      dateSection = _period$replace$split[0],
      _period$replace$split2 = _period$replace$split[1],
      timeSection = _period$replace$split2 === void 0 ? "" : _period$replace$split2;

  var result;

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

  var periodNumber = result ? parseInt(result[1]) : 0;

  if (isNaN(periodNumber)) {
    throw new Error("invalid period " + period + ", unit: " + unit);
  }

  return periodNumber;
}

function addOrSubtractPeriod(time, period, unit, isNext) {
  var opUnit = transformUnitToDayjsUnit(unit);
  return isNext ? time.add(period, opUnit) : time.subtract(period, opUnit);
}

function moveToNextPeriodByUnit(unit, time, options, isNext, onlyChecking) {
  var value = getValueByUnit(time, unit);
  var ranges = withDefaultRanges(unit, getRangesByUnit(options, unit));

  if (ranges) {
    if (ranges.length) {
      var _getRangeInfo = getRangeInfo(value, ranges, isNext),
          rangeIndex = _getRangeInfo.rangeIndex,
          inRange = _getRangeInfo.inRange;

      if (inRange) {
        if (!onlyChecking) {
          var period = options.period;
          var periodNumber = getPeriodByUnit(period, unit);
          var newTime = addOrSubtractPeriod(time, periodNumber, unit, isNext);
          return moveToNextPeriodByUnit(unit, newTime, options, isNext, true);
        }
      } else {
        var nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
        var needToCarry = false;

        if (nextRangeIndex > ranges.length - 1) {
          nextRangeIndex = 0;
          needToCarry = true;
        } else if (nextRangeIndex < 0) {
          nextRangeIndex = ranges.length - 1;
          needToCarry = true;
        }

        var nextRange = ranges[nextRangeIndex];
        var newTimeWithCurrentUnit = moveToStartOrEndOfRange(unit, time, nextRange, isNext);
        var nextUnits = [];
        var nextUnit = unit;

        while (nextUnit != null) {
          nextUnit = getNextUnit(nextUnit, options);

          if (nextUnit != null) {
            nextUnits.push(nextUnit);
          }
        }

        var newTimeWithNextUnit = newTimeWithCurrentUnit;
        nextUnits.forEach(function (nextUnit) {
          var nextUnitRanges = withDefaultRanges(nextUnit, getRangesByUnit(options, nextUnit));

          if (nextUnitRanges != null) {
            var nextUnitRange = isNext ? nextUnitRanges[0] : nextUnitRanges[nextUnitRanges.length - 1];
            newTimeWithNextUnit = moveToStartOrEndOfRange(nextUnit, newTimeWithNextUnit, nextUnitRange, isNext);
          }
        });

        if (needToCarry) {
          var prevUnit = getPrevUnit(unit, options);

          if (prevUnit == null) {
            return {
              newTime: null,
              inRange: inRange
            };
          } else {
            var newTimeWithPrevUnit = addOrSubtractPeriod(newTimeWithNextUnit, 1, prevUnit, isNext);
            return {
              newTime: moveToNextPeriodByUnit(prevUnit, newTimeWithPrevUnit, options, isNext, true).newTime,
              inRange: inRange
            };
          }
        } else {
          return {
            newTime: newTimeWithNextUnit,
            inRange: inRange
          };
        }
      }
    } else {
      var _period = options.period;

      var _periodNumber = getPeriodByUnit(_period, unit);

      return {
        newTime: addOrSubtractPeriod(time, _periodNumber, unit, isNext),
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
  var rangeIndex = isNext ? -1 : ranges.length;
  var inRange = false;

  for (var i = 0; i < ranges.length; i++) {
    var nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
    var nextRange = ranges[nextRangeIndex];

    if (num >= nextRange.start) {
      rangeIndex = nextRangeIndex;
    }

    if (num >= nextRange.start && num <= nextRange.end) {
      inRange = true;
      break;
    }
  }

  return {
    rangeIndex: rangeIndex,
    inRange: inRange
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
  var year = options.year,
      month = options.month,
      weekOfYear = options.weekOfYear,
      weekOfMonth = options.weekOfMonth,
      weekday = options.weekday,
      day = options.day,
      hour = options.hour,
      min = options.min,
      sec = options.sec;

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
  var _moveToNextPeriodByUn = moveToNextPeriodByUnit(unit, time, options, isNext, false),
      newTime = _moveToNextPeriodByUn.newTime,
      inRange = _moveToNextPeriodByUn.inRange;

  if (newTime == null) {
    return null;
  }

  if (!inRange) {
    return newTime;
  }

  var nextUnit = getNextUnit(unit, options);

  if (nextUnit) {
    return moveToNextPeriodRecursively(nextUnit, newTime, options, isNext);
  } else {
    return newTime;
  }
}

function moveToNextPeriod(time, options, isNext) {
  return moveToNextPeriodRecursively(Unit.Year, time, options, isNext);
}

var Result = /*#__PURE__*/function () {
  function Result(options, timestamp) {
    if (timestamp === void 0) {
      timestamp = dayjs().unix();
    }

    this.hasPrev = true;
    this.hasNext = true;
    this.options = options;
    this.originalTimestamp = timestamp;
    this.currentTime = dayjs.unix(timestamp);
  }

  var _proto = Result.prototype;

  _proto.reset = function reset() {
    this.currentTime = dayjs.unix(this.originalTimestamp);
  };

  _proto.prev = function prev() {
    if (!this.hasPrev) {
      return null;
    }

    if (!this.hasNext) {
      this.hasNext = true;
      return this.currentTime;
    }

    var newTime = moveToNextPeriod(this.currentTime, this.options, false);
    this.hasPrev = newTime != null;

    if (newTime != null) {
      this.currentTime = newTime;
    }

    return newTime;
  };

  _proto.next = function next() {
    if (!this.hasNext) {
      return null;
    }

    if (!this.hasPrev) {
      this.hasPrev = true;
      return this.currentTime;
    }

    var newTime = moveToNextPeriod(this.currentTime, this.options, true);
    this.hasNext = newTime != null;

    if (newTime != null) {
      this.currentTime = newTime;
    }

    return newTime;
  };

  return Result;
}();

function parseExpression(expression, timestamp) {
  var blocks = expression.split(" ");
  var options;

  if (isWeek(expression)) {
    if (isWeekOfYear(blocks)) {
      var period = blocks[0],
          year = blocks[1],
          _weekOfYear = blocks[2],
          hour = blocks[3],
          min = blocks[4],
          sec = blocks[5];

      var _weekOfYear$split = _weekOfYear.split("/"),
          week = _weekOfYear$split[0],
          _weekday = _weekOfYear$split[1];

      options = parseBlocks({
        period: period,
        year: year,
        weekOfYear: week,
        weekday: _weekday,
        hour: hour,
        min: min,
        sec: sec
      });
    } else {
      var _period2 = blocks[0],
          _year = blocks[1],
          month = blocks[2],
          weekOfMonth = blocks[3],
          _hour = blocks[4],
          _min = blocks[5],
          _sec = blocks[6];

      var _weekOfMonth$split = weekOfMonth.split("/"),
          _week = _weekOfMonth$split[0],
          _weekday2 = _weekOfMonth$split[1];

      options = parseBlocks({
        period: _period2,
        year: _year,
        month: month,
        weekOfMonth: _week,
        weekday: _weekday2,
        hour: _hour,
        min: _min,
        sec: _sec
      });
    }
  } else {
    var _expression$split = expression.split(" "),
        _period3 = _expression$split[0],
        _year2 = _expression$split[1],
        _month = _expression$split[2],
        day = _expression$split[3],
        _hour2 = _expression$split[4],
        _min2 = _expression$split[5],
        _sec2 = _expression$split[6];

    options = parseBlocks({
      period: _period3,
      year: _year2,
      month: _month,
      day: day,
      hour: _hour2,
      min: _min2,
      sec: _sec2
    });
  }

  return new Result(options, timestamp);
}

exports.parseExpression = parseExpression;

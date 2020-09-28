(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('dayjs')) :
  typeof define === 'function' && define.amd ? define(['exports', 'dayjs'], factory) :
  (global = global || self, factory(global.pcron = {}, global.dayjs));
}(this, (function (exports, dayjs) {
  dayjs = dayjs && Object.prototype.hasOwnProperty.call(dayjs, 'default') ? dayjs['default'] : dayjs;

  var _defaultRanges;

  var Unit;

  (function (Unit) {
    Unit["Year"] = "year";
    Unit["Month"] = "month";
    Unit["Day"] = "day";
    Unit["Hour"] = "hour";
    Unit["Min"] = "minute";
    Unit["Sec"] = "second";
  })(Unit || (Unit = {}));

  var defaultRanges = (_defaultRanges = {}, _defaultRanges[Unit.Year] = [-10000, 10000], _defaultRanges[Unit.Month] = [1, 12], _defaultRanges[Unit.Day] = [1, 31], _defaultRanges[Unit.Hour] = [0, 23], _defaultRanges[Unit.Min] = [0, 59], _defaultRanges[Unit.Sec] = [0, 59], _defaultRanges);

  function getDefaultRange(unit) {
    var range = defaultRanges[unit];
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
        result = dateSection.match(/(\d+)d/i);
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
    var year = options.year,
        month = options.month,
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
    var rangeIndex = isNext ? -1 : ranges.length;
    var inRange = false;

    for (var i = 0; i < ranges.length; i++) {
      var nextRangeIndex = isNext ? rangeIndex + 1 : rangeIndex - 1;
      var nextRange = ranges[nextRangeIndex];

      if (isNext && num >= nextRange.start || !isNext && num <= nextRange.end) {
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
        day = options.day,
        hour = options.hour,
        min = options.min,
        sec = options.sec;
    var parsedYear = parseRange(year, Unit.Year);
    var parsedMonth = month != null ? parseRange(month, Unit.Month) : undefined;
    var parsedDay = day != null ? parseRange(day, Unit.Day) : undefined;
    var parsedHour = parseRange(hour, Unit.Hour);
    var parsedMin = parseRange(min, Unit.Min);
    var parsedSec = parseRange(sec, Unit.Sec);
    return {
      period: period,
      year: parsedYear,
      month: parsedMonth,
      day: parsedDay,
      hour: parsedHour,
      min: parsedMin,
      sec: parsedSec
    };
  }

  function addOrSubtractDuration(time, duration, unit, isNext) {
    var opUnit = transformUnitToDayjsUnit(unit);
    return isNext ? time.add(duration, opUnit) : time.subtract(duration, opUnit);
  }

  function moveToStartOrEndOfRange(unit, time, range, periodNumber, isNext) {
    if (!isNext && periodNumber === 0) {
      return time;
    }

    var edge = isNext ? range.start : range.end - (range.end - range.start) % periodNumber;

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
        var mod = (value - range.start) % periodNumber;
        return mod === 0 ? periodNumber : mod;
      }
    }
  }

  function moveToNextPeriodByUnit(unit, time, options, isNext, onlyChecking) {
    var period = options.period;
    var periodNumber = getPeriodByUnit(period, unit);
    var value = getValueByUnit(time, unit);
    var ranges = withDefaultRanges(unit, getRangesByUnit(options, unit));

    if (ranges) {
      if (ranges.length) {
        var _getRangeInfo = getRangeInfo(value, ranges, isNext),
            rangeIndex = _getRangeInfo.rangeIndex,
            inRange = _getRangeInfo.inRange;

        if (inRange) {
          if (!onlyChecking) {
            var range = ranges[rangeIndex];
            var duration = getDurationByPeriodAndValue(value, periodNumber, range, isNext);
            var newTime = addOrSubtractDuration(time, duration, unit, isNext);
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
          var newTimeWithCurrentUnit = moveToStartOrEndOfRange(unit, time, nextRange, periodNumber, isNext);
          var nextUnits = [];
          var nextUnit = unit;

          while (nextUnit != null) {
            nextUnit = getNextUnit(nextUnit);

            if (nextUnit != null) {
              nextUnits.push(nextUnit);
            }
          }

          var newTimeWithNextUnit = newTimeWithCurrentUnit;
          nextUnits.forEach(function (nextUnit) {
            var nextUnitRanges = withDefaultRanges(nextUnit, getRangesByUnit(options, nextUnit));

            if (nextUnitRanges != null) {
              var nextUnitRange = isNext ? nextUnitRanges[0] : nextUnitRanges[nextUnitRanges.length - 1];
              var nextUnitPeriodNumber = getPeriodByUnit(period, nextUnit);
              newTimeWithNextUnit = moveToStartOrEndOfRange(nextUnit, newTimeWithNextUnit, nextUnitRange, nextUnitPeriodNumber, isNext);
            }
          });
          var prevUnit = getPrevUnit(unit);
          return needToCarry ? prevUnit == null ? null : addOrSubtractDuration(newTimeWithNextUnit, 1, prevUnit, isNext) : newTimeWithNextUnit;
        }
      }
    }

    return time;
  }

  function moveToNextPeriodRecursively(unit, time, options, isNext) {
    var newTime = moveToNextPeriodByUnit(unit, time, options, isNext, false);

    if (newTime == null) {
      return null;
    }

    var preUnit = getPrevUnit(unit);

    if (preUnit) {
      return moveToNextPeriodRecursively(preUnit, newTime, options, isNext);
    } else {
      return newTime;
    }
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

      var newTime = moveToNextPeriodRecursively(Unit.Sec, this.currentTime, this.options, false);
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

      var newTime = moveToNextPeriodRecursively(Unit.Sec, this.currentTime, this.options, true);
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

    var _expression$split = expression.split(" "),
        period = _expression$split[0],
        year = _expression$split[1],
        month = _expression$split[2],
        day = _expression$split[3],
        hour = _expression$split[4],
        min = _expression$split[5],
        sec = _expression$split[6];

    var options = parseBlocks({
      period: period,
      year: year,
      month: month,
      day: day,
      hour: hour,
      min: min,
      sec: sec
    });
    return new Result(options, timestamp);
  }

  exports.parseExpression = parseExpression;

})));

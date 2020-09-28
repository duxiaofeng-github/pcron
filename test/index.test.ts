import { parseExpression } from "..";
import dayjs from "dayjs";

const timestamp = dayjs("2020-09-23T00:00:00").unix();

test("parse expression", () => {
  const exp = parseExpression("PT1s 2020 9 23 0 0-1 0-1", timestamp);
  expect(exp.next().format()).toBe(dayjs("2020-09-23T00:00:01").format());
  expect(exp.next().format()).toBe(dayjs("2020-09-23T00:01:00").format());
  expect(exp.next().format()).toBe(dayjs("2020-09-23T00:01:01").format());
  expect(exp.next()).toBeNull();
});

test("complete period expression", () => {
  const exp = parseExpression("P1Y2M3DT4H5M6S * * * * * *", dayjs("2020-01-01T00:00:00").unix());
  expect(exp.next().format()).toBe(dayjs("2021-03-04T04:05:06").format());
});

test("uncontinuous period expression", () => {
  const exp = parseExpression("P1Y2DT3H4S * * * * * *", dayjs("2020-01-01T00:00:00").unix());
  expect(exp.next().format()).toBe(dayjs("2021-01-03T03:00:04").format());
  expect(exp.next().format()).toBe(dayjs("2022-01-05T06:00:08").format());
});

test("expression with multi-ranges", () => {
  const exp = parseExpression("PT4s * * * * * 1-10,20-30", dayjs("2020-01-01T00:00:00").unix());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:01").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:05").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:09").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:20").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:24").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:28").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:01:01").format());
});

test("last one timestamp", () => {
  const exp = parseExpression("PT4s 2020 1 1 0 0 1-10,20-30", dayjs("2020-01-01T00:00:00").unix());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:01").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:05").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:09").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:20").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:24").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:28").format());
  expect(exp.next()).toBeNull();
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:28").format());
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:24").format());
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:20").format());
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:09").format());
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:05").format());
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:01").format());
  expect(exp.prev()).toBeNull();
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:01").format());
});

test("continuous range expression", () => {
  const exp = parseExpression("PT9s 2020 1 1 0 0 0-9,9-19,19-29,29-39,39-49,49-59", dayjs("2020-01-01T00:00:00").unix());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:09").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:18").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:27").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:36").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:45").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:54").format());
  expect(exp.next()).toBeNull();
});

test("timestamp is out of range: next time should be next year", () => {
  const exp = parseExpression("PT1s 2021-2022 * * * * *", timestamp);
  expect(exp.next().format()).toBe(dayjs("2021-01-01T00:00:00").format());
});

test("timestamp is out of range: next time should be null", () => {
  const exp = parseExpression("PT1s 2018-2019 * * * * *", timestamp);
  expect(exp.next()).toBeNull();
});

test("timestamp is out of range: next time should be start of second range", () => {
  const exp = parseExpression("PT1s 2018-2019,2021-2022 * * * * *", timestamp);
  expect(exp.next().format()).toBe(dayjs("2021-01-01T00:00:00").format());
});

test("timestamp is out of range: next time after carrying of year should be null", () => {
  const exp = parseExpression("PT1s 2020 6-7 * * * *", timestamp);
  expect(exp.next()).toBeNull();
});

test("timestamp is out of range: next time after carrying of day should be Oct.", () => {
  const exp = parseExpression("PT1s 2020 * 21-22 * * *", timestamp);
  expect(exp.next().format()).toBe(dayjs("2020-10-21T00:00:00").format());
});

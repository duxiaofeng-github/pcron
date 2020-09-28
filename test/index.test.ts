import { parseExpression } from "..";
import dayjs from "dayjs";

const timestamp = dayjs("2020-09-23T00:00:00+08:00").unix();

test("parse expression", () => {
  const exp = parseExpression("PT1s * * * * * *", timestamp);
  expect(exp.next().unix()).toBe(timestamp + 1);
  expect(exp.next().unix()).toBe(timestamp + 2);
});

test("complete period expression", () => {
  const exp = parseExpression("P1Y2M3DT4H5M6S * * * * * *", dayjs("2020-01-01T00:00:00+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2021-03-04T04:05:06+08:00").unix());
});

test("uncontinuous period expression", () => {
  const exp = parseExpression("P1Y2DT3H4S * * * * * *", dayjs("2020-01-01T00:00:00+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2021-01-03T03:00:04+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2022-01-05T06:00:08+08:00").unix());
});

test("expression with multi-ranges", () => {
  const exp = parseExpression("PT4s * * * * * 1-10,20-30", dayjs("2020-01-01T00:00:00+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:01+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:05+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:09+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:20+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:24+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:28+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:01:01+08:00").unix());
});

test("last one timestamp", () => {
  const exp = parseExpression("PT4s 2020 1 1 0 0 1-10,20-30", dayjs("2020-01-01T00:00:00+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:01+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:05+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:09+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:20+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:24+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:28+08:00").unix());
  expect(exp.next()).toBeNull();
  expect(exp.prev().unix()).toBe(dayjs("2020-01-01T00:00:28+08:00").unix());
  expect(exp.prev().unix()).toBe(dayjs("2020-01-01T00:00:24+08:00").unix());
  expect(exp.prev().unix()).toBe(dayjs("2020-01-01T00:00:20+08:00").unix());
  expect(exp.prev().unix()).toBe(dayjs("2020-01-01T00:00:09+08:00").unix());
  expect(exp.prev().unix()).toBe(dayjs("2020-01-01T00:00:05+08:00").unix());
  expect(exp.prev().unix()).toBe(dayjs("2020-01-01T00:00:01+08:00").unix());
  expect(exp.prev()).toBeNull();
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:01+08:00").unix());
});

test("continuous range expression", () => {
  const exp = parseExpression("PT9s 2020 1 1 0 0 0-9,9-19,19-29,29-39,39-49,49-59", dayjs("2020-01-01T00:00:00+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:09+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:18+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:27+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:36+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:45+08:00").unix());
  expect(exp.next().unix()).toBe(dayjs("2020-01-01T00:00:54+08:00").unix());
  expect(exp.next()).toBeNull();
});

test("timestamp is out of range: next time should be next year", () => {
  const exp = parseExpression("PT1s 2021-2022 * * * * *", timestamp);
  expect(exp.next().unix()).toBe(dayjs("2021-01-01T00:00:00+08:00").unix());
});

test("timestamp is out of range: next time should be null", () => {
  const exp = parseExpression("PT1s 2018-2019 * * * * *", timestamp);
  expect(exp.next()).toBeNull();
});

test("timestamp is out of range: next time should be start of second range", () => {
  const exp = parseExpression("PT1s 2018-2019,2021-2022 * * * * *", timestamp);
  expect(exp.next().unix()).toBe(dayjs("2021-01-01T00:00:00+08:00").unix());
});

test("timestamp is out of range: next time after carrying of year should be null", () => {
  const exp = parseExpression("PT1s 2020 6-7 * * * *", timestamp);
  expect(exp.next()).toBeNull();
});

test("timestamp is out of range: next time after carrying of day should be Oct.", () => {
  const exp = parseExpression("PT1s 2020 * 21-22 * * *", timestamp);
  expect(exp.next().unix()).toBe(dayjs("2020-10-21T00:00:00+08:00").unix());
});

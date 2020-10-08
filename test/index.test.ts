import { parseExpression } from "..";
import dayjs from "dayjs";
import zhCN from "dayjs/locale/zh-cn";

dayjs.locale(zhCN); // set the first day of week to Monday

// const timestamp = dayjs("2020-09-23T00:00:00").unix();

// test("parse expression", () => {
//   const exp = parseExpression("PT1s 2020 9 23 0 0-1 0-1", timestamp);
//   expect(exp.next().format()).toBe(dayjs("2020-09-23T00:00:01").format());
//   expect(exp.next().format()).toBe(dayjs("2020-09-23T00:01:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-09-23T00:01:01").format());
//   expect(exp.next()).toBeNull();
// });

// test("complete period expression", () => {
//   const exp = parseExpression("P1Y2M3DT4H5M6S * * * * * *", dayjs("2020-01-01T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2021-03-04T04:05:06").format());
// });

test("minute period expression", () => {
  const exp = parseExpression("pt1m * * * * * *", dayjs("2020-01-01T00:00:00").unix());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:01:00").format());
  expect(exp.next().format()).toBe(dayjs("2020-01-01T00:02:00").format());
  expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:01:00").format());
});

// test("uncontinuous period expression", () => {
//   const exp = parseExpression("P1Y2DT3H4S * * * * * *", dayjs("2020-01-01T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2021-01-03T03:00:04").format());
//   expect(exp.next().format()).toBe(dayjs("2022-01-05T06:00:08").format());
// });

// test("expression with multi-ranges", () => {
//   const exp = parseExpression("PT4s * * * * * 1-10,20-30", dayjs("2020-01-01T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:01").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:05").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:09").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:20").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:24").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:28").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:01:01").format());
// });

// test("last one timestamp", () => {
//   const exp = parseExpression("PT4s 2020 1 1 0 0 1-10,20-30", dayjs("2020-01-01T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:01").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:05").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:09").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:20").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:24").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:28").format());
//   expect(exp.next()).toBeNull();
//   expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:28").format());
//   expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:24").format());
//   expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:20").format());
//   expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:09").format());
//   expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:05").format());
//   expect(exp.prev().format()).toBe(dayjs("2020-01-01T00:00:01").format());
//   expect(exp.prev()).toBeNull();
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:01").format());
// });

// test("continuous range expression", () => {
//   const exp = parseExpression("PT9s 2020 1 1 0 0 0-9,9-19,19-29,29-39,39-49,49-59", dayjs("2020-01-01T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:09").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:18").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:27").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:36").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:45").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:54").format());
//   expect(exp.next()).toBeNull();
// });

// test("expression with week of month", () => {
//   const exp = parseExpression("P3D 2020 1-2 1-5/0-4 * * *", dayjs("2019-12-29T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-06T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-09T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-13T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-16T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-20T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-23T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-27T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-30T00:00:00").format());

//   expect(exp.next().format()).toBe(dayjs("2020-02-03T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-06T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-10T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-13T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-17T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-20T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-24T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-02-27T00:00:00").format());
//   expect(exp.next()).toBeNull();

//   const exp2 = parseExpression("P1D * 5-6 1-6/5-6 * * *", dayjs("2020-04-30T00:00:00").unix());

//   // May of 2020 has 5 weekends and 6 weeks, June of 2020 has 4 weekends and 5 weeks
//   expect(exp2.next().format()).toBe(dayjs("2020-05-02T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-03T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-09T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-10T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-16T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-17T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-23T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-24T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-30T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-05-31T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-06T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-07T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-13T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-14T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-20T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-21T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-27T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2020-06-28T00:00:00").format());
//   expect(exp2.next().format()).toBe(dayjs("2021-05-01T00:00:00").format());
// });

// test("expression with week of year", () => {
//   const exp = parseExpression("P3D 2020 1-5/0-4 * * *", dayjs("2019-12-31T00:00:00").unix());
//   expect(exp.next().format()).toBe(dayjs("2020-01-01T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-06T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-09T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-13T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-16T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-20T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-23T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-27T00:00:00").format());
//   expect(exp.next().format()).toBe(dayjs("2020-01-30T00:00:00").format());

//   expect(exp.next()).toBeNull();
// });

// test("timestamp is out of range: next time should be next year", () => {
//   const exp = parseExpression("PT1s 2021-2022 * * * * *", timestamp);
//   expect(exp.next().format()).toBe(dayjs("2021-01-01T00:00:00").format());
// });

// test("timestamp is out of range: next time should be null", () => {
//   const exp = parseExpression("PT1s 2018-2019 * * * * *", timestamp);
//   expect(exp.next()).toBeNull();
// });

// test("timestamp is out of range: next time should be start of second range", () => {
//   const exp = parseExpression("PT1s 2018-2019,2021-2022 * * * * *", timestamp);
//   expect(exp.next().format()).toBe(dayjs("2021-01-01T00:00:00").format());
// });

// test("timestamp is out of range: next time after carrying of year should be null", () => {
//   const exp = parseExpression("PT1s 2020 6-7 * * * *", timestamp);
//   expect(exp.next()).toBeNull();
// });

// test("timestamp is out of range: next time after carrying of day should be Oct.", () => {
//   const exp = parseExpression("PT1s 2020 * 21-22 * * *", timestamp);
//   expect(exp.next().format()).toBe(dayjs("2020-10-21T00:00:00").format());
// });

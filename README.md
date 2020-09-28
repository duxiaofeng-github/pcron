# pcron

[![NPM version][npm-image]][npm-url]
[![NPM downloads][downloads-image]][downloads-url]
[![Build status][travis-image]][travis-url]

pcron is a periodical scheduler expression tool inspired by [fcron](http://fcron.free.fr/)

## Example

```
PT1h 2020 * 21-22 * * *
```

Like the example above, it means "from 21 through 22 of every month in 2020, the scheduler will be executed every 1 hour".

For more example, see [test](./test/index.test.ts)

## Installation

```
yarn add pcron
```

or

```
npm i pcron
```

## Usage

```ts
import { parseExpression } from "pcron";
import dayjs from "dayjs";

const timestamp = dayjs("2020-09-23T00:00:00+08:00").unix();
// timestamp is a unix timestamp, a current timestamp will be used by default if you omit this parameter
const exp = parseExpression("PT1s 2020 9 23 0 0-1 0-1", timestamp);
const nextDate = exp.next(); // you will get a dayjs object represent 2020-09-23T00:00:01+08:00
const nextDate = exp.next(); // you will get a dayjs object represent 2020-09-23T00:01:00+08:00
const nextDate = exp.next(); // you will get a dayjs object represent 2020-09-23T00:01:01+08:00
const nextDate = exp.next(); // you will get null
```

## Changelog

[change log](./CHANGELOG)

## License

MIT

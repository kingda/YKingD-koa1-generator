
koa1 application generator.

[![NPM Version][npm-image]][npm-url]

## Description

The purpose of the package is making koa1 application easier for you.I was inspired by the another package named express-generator which can generate express application quickly.As for the version of node,i can not use the koa2 to run on the node 4.6.So i find a compromise not only i can use koa but also the project can be run on the low version of node.At last but not least,i hope you will enjoy it.

## Installation

```sh
$ npm install -g ykd-koa1-generator
```

## Quick Start

Create the app:

```bash
$ mkdir hello-ykoa1
$ cd hello-ykoa1
$ ykoa1
```

Install dependencies:

```bash
$ npm install
```

Start your  app at `http://localhost:5223/`:

```bash
$ node app.js
```

## Command Line Options

This generator can also be further configured with the following command line flags.

        --git            add .gitignore
    -f, --force          force on non-empty directory

## License

[MIT](LICENSE)

## Thanks
[express-generator](https://www.npmjs.com/package/express-generator)


[npm-image]: https://img.shields.io/npm/v/ykd-koa1-generator.svg
[npm-url]: https://npmjs.org/package/ykd-koa1-generator
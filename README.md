# decompress-tar [![Build Status](https://travis-ci.org/kevva/decompress-tar.svg?branch=master)](https://travis-ci.org/kevva/decompress-tar)

> tar decompress plugin

## Install

```sh
$ npm install --save decompress-tar
```

## Usage

```js
var Decompress = require('decompress');
var tar = require('decompress-tar');

var decompress = new Decompress()
    .src('foo.tar')
    .dest('dest')
    .use(tar({ strip: 1 }));

decompress.run(function (err, files) {
    if (err) {
        throw err;
    }

    console.log('Files extracted successfully!'); 
});
```

You can also use this plugin with [gulp](http://gulpjs.com):

```js
var gulp = require('gulp');
var tar = require('decompress-tar');

gulp.task('default', function () {
    return gulp.src('foo.tar')
        .pipe(tar({ strip: 1 }))
        .pipe(gulp.dest('dest'));
});
```

## Options

### strip

Type: `Number`  
Default: `0`

Equivalent to `--strip-components` for tar.

## License

MIT © [Kevin Mårtensson](https://github.com/kevva)

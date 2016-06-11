var gulp = require("gulp");
var rename = require('gulp-rename');
var fs = require("fs");
var ts = require('gulp-typescript');
var tslint = require('gulp-tslint');
var es = require('event-stream');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var runSequence = require('run-sequence');
var rimraf = require('rimraf');

var paths = {
    typescript: {
        tsconfig: "tsconfig.json",
        src: ['ts/**.ts'],
        dest: './js/tmp/'
    },
    javascript: {
        src: './js/tmp/*.js',
        dest: './js/tmp/app.js',
        min: './js/tmp/app.min.js'
    }
};

/**
 * TypeScript tasks.
 */

gulp.task('ts:compile', function() {
    var tsProject = ts.createProject('tsconfig.json');
    var tsResult = tsProject.src(paths.typescript.src) // instead of gulp.src(...)
        .pipe(ts(tsProject));
    return tsResult.js.pipe(gulp.dest(paths.typescript.dest));

});

gulp.task('ts:lint', function() {
    return gulp.src(paths.typescript.src)
        .pipe(tslint())
        .pipe(tslint.report('prose', {
            emitError: false
        }));
});

/**
 * JavaScript tasks.
 */

gulp.task('js:browserify', function() {
    return browserify({debug:true})
        .add('./js/tmp/index.js')
        .bundle()
        .pipe(source('./app.js'))
        //.pipe(streamify(uglify()))
        //.pipe(rename('app.js'))
        .pipe(gulp.dest('./js/'));
});

gulp.task('js:cleanup', function (cb) {
    return rimraf('./js/tmp', cb);
});

gulp.task('build-js', function(done) {
    runSequence('ts:compile', 'js:browserify', 'js:cleanup', function() {
        console.log('JavaScript built.');
        done();
    });
});


/**
 * Run everything in order.
 */
gulp.task('default', ['build-js']);
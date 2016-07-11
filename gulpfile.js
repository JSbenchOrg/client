var gulp        = require('gulp');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var tsify       = require('tsify');
var gulp        = require('gulp');
var server      = require('gulp-server-livereload');

gulp.task('tsc', function() {
    console.log('Transpile ts/ -> js/ ...');
    return browserify({debug: true})
        .add('ts/index.ts')
        .plugin(tsify)
        .bundle()
        .on('error', function (e) {
            console.log(e.message);
        })
        .pipe(source('app.min.js'))
        .pipe(gulp.dest('public/js/'));
});

gulp.task('watch-tsc', function() {
    gulp.watch('ts/**/*.ts', { interval: 1000 }, ['tsc'])
});

/**
 * TypeScript tasks.
 */

//gulp.task('ts:compile', function() {
//    var tsProject = ts.createProject('tsconfig.json');
//    var tsResult = tsProject.src(paths.typescript.src).pipe(ts(tsProject));
//    console.log(tsResult);
//    return tsResult.js.pipe(gulp.dest(paths.typescript.dest));
//});

//gulp.task('ts:compile', function() {
//    var tsProject = ts.createProject('tsconfig.json');
//    var tsResult = gulp.src('ts/**/*.ts').pipe(ts(tsProject));
//    return tsResult.js.pipe(gulp.dest('js/tmp'));
//});

gulp.task('serve', function() {
    gulp.src('public').pipe(server({
        livereload: true,
        directoryListing: false,
        open: true,
        port: 8000,
        // host: 'localhost',
        host: 'jsbench.net.serbang',
        defaultFile: 'index.html',
    }));
});

gulp.task('default', ['watch-tsc', 'tsc', 'serve']);
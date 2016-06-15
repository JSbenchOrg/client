var gulp        = require('gulp');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var tsify       = require('tsify');

gulp.task('tsc', function() {
    return browserify({debug: true})
        .add('ts/index.ts')
        .plugin(tsify)
        .bundle()
        .on('error', function (e) {
            console.log(e.message);
        })
        .pipe(source('app.min.js'))
        .pipe(gulp.dest('js/'));
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
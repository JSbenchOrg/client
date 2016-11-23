var gulp        = require('gulp');
var browserify  = require('browserify');
var source      = require('vinyl-source-stream');
var tsify       = require('tsify');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync').create();

gulp.task('tsc', function() {
    return browserify({debug: true})
        .add('src/index.ts')
        .plugin(tsify)
        .bundle()
        .on('error', function (e) {
            console.log(e.message);
        })
        .pipe(source('app.min.js'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('serve', ['tsc'], function() {
    browserSync.init({
        server: './dist',
        ui: false,
        files: ['js/app.min.js', 'index.html']
    });

    gulp.watch('src/**/*.ts', function() {
        runSequence('tsc');
    });
    gulp.watch('dist/js/app.min.js').on('change', browserSync.reload);
});
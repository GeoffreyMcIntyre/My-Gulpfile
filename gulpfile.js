// gulp.js

/*
*   Author: Geoffrey McIntyre
*   Email: geoffreymcintyre89@gmail.com
*
*   Instructions
*   
*   gulp                    (To run gulp)
*   gulp --type production  (To run gulp with production output)
*   gulp test               (To run Mocha Chai tests)
*/

var gulp            = require('gulp');

var gutil           = require('gulp-util');
var sass            = require('gulp-sass');
var jshint          = require('gulp-jshint');
var sourcemaps      = require('gulp-sourcemaps');
var concat          = require('gulp-concat');
var minifyCSS       = require('gulp-minify-css');
var uglify          = require('gulp-uglify');
var rename          = require('gulp-rename');
var browserify      = require('gulp-browserify');
var mochaPhantomjs  = require('gulp-mocha-phantomjs');
var browserSync     = require('browser-sync');
var del             = require('del');
var reload          = browserSync.reload;
var nodemon         = require('gulp-nodemon');

var bases = {
    app: 'app/',
    dist: 'dist/'
};

var paths = {
    scriptsOrig: [bases.app + 'js/**/*.js'],
    scriptsDest: bases.dist + 'js/',
    scriptsTest: 'test/client/**/*.js',
    libs: bases.dist + 'libs/',
    stylesOrig: [bases.app + 'scss/**/*.scss'],
    stylesDest: bases.dist + 'css/',
    html: [bases.dist + '/**/*.html'],
    images: bases.dist + 'imgs/',
    extras: ['crossdomain.xml', 'humans.txt', 'manifest.appcache', 'robots.txt', 'favicon.ico']
};

gulp.task('browserSync', ['nodemon'], function(){
    browserSync.init({
        open: true,
        proxy: "http://localhost:5000",
        port: 8080,
        ui: {
            port: 8081
        },
        startPath: "/"
    });
});

gulp.task('clean', function() {
    return del([paths.scriptsDest + '/*', paths.stylesDest + '/**/*.css', paths.stylesDest + '/**/*.map']);
});

gulp.task('html', function(){
    return gulp.src(paths.html)
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('css', function(){
    return gulp.src(paths.stylesOrig)
        .pipe(sourcemaps.init()) // Process the original sources
        .pipe(sass({outputStyle: 'expanded'}).on('error', sass.logError))
        .pipe(gutil.env.type === 'production' ? rename({suffix: '.min'}) : gutil.noop()) //only add .min if '--type production'
        .pipe(gutil.env.type === 'production' ? minifyCSS() : gutil.noop()) //only minify if '--type production'
        .pipe(sourcemaps.write('/')) // Add the map to modified source
        .pipe(gulp.dest(paths.stylesDest))
        .pipe(browserSync.reload({
            stream: true
        }));
});

gulp.task('js', function(){
    return gulp.src(paths.scriptsOrig)
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(sourcemaps.init())
        .pipe(concat('app.js'))
        .pipe(gutil.env.type === 'production' ? rename({suffix: '.min'}) : gutil.noop()) //only add .min if '--type production'
        .pipe(gutil.env.type === 'production' ? uglify({mangle: false}) : gutil.noop()) //only uglify if '--type production'
        .pipe(sourcemaps.write('/'))
        .pipe(gulp.dest(paths.scriptsDest));
});

gulp.task('lint-test', function() {
    return gulp.src('test/**/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('browserify-test', ['lint-test'], function() {
    return gulp.src('test/client/index.js')
        .pipe(browserify({
            insertGlobals: true
        }))
        .pipe(rename('client-test.js'));
});

gulp.task('test', ['browserify-test'], function() {
    return gulp.src('test/client/index.html')
        .pipe(mochaPhantomjs());
});

gulp.task('watch', function(){
    gulp.watch([paths.html], ['html']);
    gulp.watch([paths.stylesOrig], ['css']);
    gulp.watch([paths.scriptsOrig], ['js']);
    gulp.watch([paths.scriptsOrig, paths.html], reload);
});

gulp.task('nodemon', function (cb) {
    var called = false;
    return nodemon({
        script: 'server.js',
        ignore: [
            'gulpfile.js',
            'node_modules/'
        ]
    })
    .on('start', function () {
        if (!called) {
            called = true;
            cb();
        }
    })
    .on('restart', function () {
        setTimeout(function () {
            reload({ stream: false });
        }, 1000);
    });
});

gulp.task('default', ['clean'], function(){
    gulp.start('html', 'css', 'js', 'browserSync', 'watch');
});

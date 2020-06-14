/* eslint-disable no-undef */
'use strict';

const SASS_OUTPUT_STYLE = 'compressed';  // 'expanded' or 'compressed'

const gulp = require('gulp');
const $ = require('gulp-load-plugins')({ pattern: ['gulp-*'] });
$.sass.compiler = require('sass');


gulp.task('js', () => gulp.src('src/**/*.js')
	.pipe($.plumber())
	.pipe($.sourcemaps.init())
	.pipe($.babel())
	.pipe($.terser())
	.pipe($.rename({ extname: '.min.js' }))
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('./dist'))
);

gulp.task('sass', () => gulp.src(['src/**/*.scss'])
	.pipe($.plumber({
		errorHandler: function (err) {
			console.log(err.messageFormatted);
			this.emit('end');
		}
	}))
	.pipe($.sourcemaps.init())
	.pipe($.sass({ outputStyle: SASS_OUTPUT_STYLE }))
	.pipe($.autoprefixer({ remove: false }))
	.pipe($.rename({ extname: '.min.css' }))
	.pipe($.sourcemaps.write('.'))
	.pipe(gulp.dest('./dist'))
);

gulp.task('watch', () => {
	gulp.watch('src/**/*.js', gulp.series('js'));
	gulp.watch('src/**/*.scss', gulp.series('sass'));
});

gulp.task('build', gulp.parallel('js', 'sass'));

gulp.task('default', gulp.series('build', 'watch'));

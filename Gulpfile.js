// File: Gulpfile.js
'use strict';

var gulp 	= require('gulp'),
	connect = require('gulp-connect'),
	stylus	= require('gulp-stylus'),
	nib		= require('nib'),
	jshint	= require('gulp-jshint'),
	stylish	= require('jshint-stylish'),
	inject	= require('gulp-inject'),
	wiredep	= require('wiredep').stream,
	gulpif	= require('gulp-if'),
	minifyCss = require('gulp-minify-css'),
	useref	= require('gulp-useref'),
	uglify	= require('gulp-uglify'),
	uncss	= require('gulp-uncss'),
	angularFilesort = require('gulp-angular-filesort'),
	templateCache = require('gulp-angular-templatecache'),
	historyApiFallBack = require('connect-history-api-fallback');

// Servidor web de desarrollo
gulp.task('server', function() {
	connect.server({
		root: './app',
		hostname: '0.0.0.0',
		port: 8080,
		livereload: true,
		middleware: function(connect, opt) {
			return [historyApiFallBack];
		}
	});
});

// Servidor web de produccion
gulp.task('server-dist', function() {
	connect.server({
		root: './dist',
		hostname: '0.0.0.0',
		port: 8080,
		livereload: true,
		middleware: function(connect, opt) {
			return [historyApiFallBack];
		}
	});
});

// Buscador errores en el JS y nos lo muestra por pantalla
gulp.task('jshint', function() {
	return gulp.src('./app/scripts/**/*.js')
		.pipe(jshint('.jshintrc'))
		.pipe(jshint.reporter('jshint-stylish'))
		.pipe(jshint.reporter('fail'));
});

// Preprocesador de archivos Stylus a CSS y recarga de cambios
gulp.task('css', function() {
	gulp.src('./app/stylesheets/main.styl')
		.pipe(stylus({use: nib()}))
		.pipe(gulp.dest('./app/stylesheets'))
		.pipe(connect.reload());
});

// Recarga de navegador cuando hay cambios en el HTML
gulp.task('html', function() {
	gulp.src('./app/**/*.html')
		.pipe(connect.reload());
});

// Busqueda en carpetas style y js archivos nuevos para inyectarlos en index
gulp.task('inject', function() {
	return gulp.src('index.html', {cwd: './app'})
		.pipe(inject(
			gulp.src(['./app/scripts/**/*.js']).pipe(angularFilesort()), {
			read: false,
			ignorePath: '/app'
		}))
		.pipe(inject(
			gulp.src(['./app/stylesheets/**/*.css']), {
			read: false,
			ignorePath: '/app'
		}))
		.pipe(gulp.dest('./app'));
});

// Inyectar librerias instaladas via bower
gulp.task('wiredep', function() {
	gulp.src('./app/index.html')
		.pipe(wiredep({
			directory: './app/lib'
		}))
		.pipe(gulp.dest('./app'));
});

// Compilacion de templates HTML para inyectar en el codigo
gulp.task('templates', function() {
	gulp.src('./app/views/**/*.tpl.html')
		.pipe(templateCache({
			root: 'views/',
			module: 'app.templates',
			standalone: true
		}))
		.pipe(gulp.dest('./app/scripts'));
});

// Compresion/minificacion de archivos CSS y JS enlazados en el index
gulp.task('compress', function() {
	gulp.src('./app/index.html')
		.pipe(useref.assets())
		.pipe(gulpif('*.js', uglify({mangle: false})))
		.pipe(gulpif('*.css', minifyCss()))
		.pipe(gulp.dest('./dist'));
});

// Limpieza de CSS que no se utiliza para reducir peso en archivo
gulp.task('uncss', function() {
	gulp.src('./dist/css/style.min.css')
		.pipe(uncss({
			html: ['./app/index.html', './app/views/post-list.tpl.html', './app/views/post-detail.tpl.html']
		}))
		.pipe(gulp.dest('./dist/css'));
});

// Despliegue desde desarrollo a producción sin tags ni comentarios
gulp.task('copy', function() {
	gulp.src('./app/index.html')
		.pipe(useref())
		.pipe(gulp.dest('./dist'));
	gulp.src('./app/lib/fontawesome/fonts/**')
		.pipe(gulp.dest('./dist/fonts'));
});

// Vigilancia de cambios que se produzcan en el codigo
// Lanzamiento de tareas relacionadas
gulp.task('watch', function() {
	gulp.watch(['./app/**/*.html'], ['html', 'templates']);
	gulp.watch(['./app/stylesheets/**/*.styl'], ['css', 'inject']);
	gulp.watch(['./app/scripts/**/*.js', './Gulpfile.js'], ['jshint', 'inject']);
	gulp.watch(['./bower.json'], ['wiredep']);
});

gulp.task('default', ['server', 'templates', 'inject', 'wiredep', 'watch']);
gulp.task('build', ['templates', 'compress', 'copy', 'uncss']);
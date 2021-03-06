"use strict";
const gulp = require('gulp');
const mocha = require('gulp-mocha');
const tar = require('gulp-tar');
const gzip = require('gulp-gzip');
const exec = require('gulp-exec');
const bump = require('gulp-bump');
const git = require('gulp-git');
const fs = require('fs');
const install = require("gulp-install");
const del = require('del');
const yargs = require('yargs');

var packageJson = require('./package.json');
var releaseVersion = packageJson.version;

gulp.task('test-xunit', function() {
	process.env.NODE_ENV = 'test';
	return gulp.src(['test/app/**/*.js', '!test/app/resources/**',
			'!test/outputs/**'
		], {
			read: false
		})
		.pipe(mocha({
			reporter: "xunit-file"
		}));
});

gulp.task('test', function() {
	process.env.NODE_ENV = 'test';
	return gulp.src(['test/app/**/*.js', '!test/app/resources/**',
			'!test/outputs/**'
		], {
			read: false
		})
		.pipe(mocha());
});

gulp.task('dist-clean', function() {
	return del(['dist/**/*', 'dist/*.tar.gz']);
});

gulp.task('dist-source', ['clean'], function() {
	var pkg = JSON.parse(fs.readFileSync('./package.json'));
	return gulp.src(['**/*', '!test', '!test/**', '!dist', '!dist/**', '!.*',
			'!*.*'
		])
		.pipe(gulp.dest('dist/monitoring-app'));
});

gulp.task('dist-package', ['dist-source', 'dist-clean'], function() {
	var pkg = JSON.parse(fs.readFileSync('./package.json'));
	return gulp.src('dist/**/*')
		.pipe(tar('monitor-' + pkg.version + '.tar'))
		.pipe(gzip())
		.pipe(gulp.dest('dist/'));
});

gulp.task('docker-clean', function() {
	return del('docker/monitoring-app/**/*');
});

gulp.task('docker-source', ['docker-clean'], function() {
	var pkg = JSON.parse(fs.readFileSync('./package.json'));
	return gulp.src(['**/*', '!test', '!test/**', '!dist', '!dist/**',
			'!docker/**', '!.*',
			'!*.*'
		])
		.pipe(gulp.dest('docker/monitoring-app'));
});

gulp.task('bump-version', function() {
	return gulp.src('./package.json')
		.pipe(bump({
			type: 'minor'
		}))
		.pipe(gulp.dest('./'));
});

gulp.task('udpate-version', function() {
	var argv = yargs.argv;
	var validBumpTypes = "major|minor|patch|prerelease".split("|");
	var ver = (argv.ver || 'patch').toLowerCase();
	var isRelease = argv.release ? true : false;

	if (validBumpTypes.indexOf(ver) === -1) {
		throw new Error('Unrecognized version "' + ver + '".');
	} else {
		return gulp.src('./package.json')
			.pipe(bump({
				type: argv.ver
			}))
			.pipe(gulp.dest('./'));
	}
});

gulp.task('git-create-release', function() {
	git.checkout('release/' + releaseVersion, {
		args: '-b'
	}, function(err) {
		if (err) throw err;
	});
});

gulp.task('git-tag-release', function() {
	git.tag(packageJson.version, '', function(err) {
		if (err) throw err;
	});
});

gulp.task('git-commit-version-update', function() {
	return gulp.src('./package.json')
		.pipe(git.commit('updated version'));
});

gulp.task('git-commit', function() {
	gulp.src('./*')
		.pipe(git.commit(undefined, {
			args: '-am "pipeline update for release:' + releaseVersion + '"',
			disableMessageRequirement: true
		}));
});

gulp.task('git-create-release', function() {
	return git.checkout('release/' + packageJson.version, {
		args: '-b'
	}, function(err) {
		if (err) throw err;
	});
});

gulp.task('git-push-release', function() {
	git.push('origin', 'release/' + releaseVersion, function(err) {
		if (err) throw err;
	});
});

gulp.task('git-checkout-develop', function() {
	git.checkout('develop', function(err) {
		if (err) throw err;
	});
});

gulp.task('git-push-develop', function() {
	git.push('origin', 'develop', function(err) {
		if (err) throw err;
	});
});
gulp.task('git-push-master', function() {
	git.push('origin', 'master', function(err) {
		if (err) throw err;
	});
});
gulp.task('git-checkout-master', function() {
	git.checkout('master', function(err) {
		if (err) throw err;
	});
});

gulp.task('git-merge-release', function() {
	git.merge('release/' + releaseVersion, {
		args: '--no-ff'
	}, function(err) {
		if (err) throw err;
	});
});
gulp.task('dist', ['dist-clean', 'test', 'dist-package']);

gulp.task('docker-prep', ['docker-clean', 'docker-source']);

gulp.task('setup-for-release', [
	'git-create-release',
	'git-tag-release',
	'git-commit',
	'git-push-release',
	'git-checkout-develop',
	'git-merge-release',
	'git-commit',
	'bump-version',
	'git-commit',
	'git-push-develop',
	'git-checkout-master',
	'git-merge-release',
	'git-commit',
	'git-push-master'
]);

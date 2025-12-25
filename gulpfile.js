const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

function copyIcons() {
	const globs = [
		'nodes/**/*.{png,svg}',
		'nodes/**/*.{่json}',
		'credentials/**/*.{png,svg}',
		'assets/*.{png,svg}',
	];
	return src(globs, { base: '.' }).pipe(dest('dist'));
}

task('build:icons', copyIcons);

module.exports = {
	copyIcons,
};
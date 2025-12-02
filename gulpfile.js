const path = require('path');
const { task, src, dest } = require('gulp');

task('build:icons', copyIcons);

// function copyIcons() {
// 	const nodeSource = path.resolve('nodes', '**', '*.{png,svg}');
// 	const nodeDestination = path.resolve('dist', 'nodes');

// 	src(nodeSource).pipe(dest(nodeDestination));

// 	const credSource = path.resolve('credentials', '**', '*.{png,svg}');
// 	const credDestination = path.resolve('dist', 'credentials');

// 	return src(credSource).pipe(dest(credDestination));
// }

function copyIcons() {
	// รวมทุก path ที่อยากให้ copy
	const globs = [
		'nodes/**/*.{png,svg}',
		'credentials/**/*.{png,svg}',
		'assets/*.{png,svg}',
		// ถ้ามีโฟลเดอร์ assets สำหรับ icon อื่น ๆ ให้ปลดคอมเมนต์บรรทัดนี้
		// 'assets/**/*.{png,svg}',
	];

	// base: '.' = รักษาโครงโฟลเดอร์เดิม แล้วไปลงใต้ dist/
	// เช่น nodes/PostReceipt/PEAK.png -> dist/nodes/PostReceipt/PEAK.png
	return src(globs, { base: '.' }).pipe(dest('dist'));
}

task('build:icons', copyIcons);

module.exports = {
	copyIcons,
};
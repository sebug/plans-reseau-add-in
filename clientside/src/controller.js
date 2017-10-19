/* global $, Office, Excel */
import helpers from "helpers";
import dropDownHelper from "dropDownHelper";

async function enterLines(lines) {
    await Excel.run(async function (context) {
	const sheet = context.workbook.worksheets.getFirst();
	sheet.activate();
	sheet.load('name');
	await context.sync();
	console.log(`The active worksheet is "${sheet.name}"`);

	const table = sheet.tables.getItemAt(0);

	table.load('name');

	await context.sync();

	console.log(table.name);

	return true;
    });
}

async function chooseCourse() {
    const courseID = $('.cours-dropdown input[name="cours"]').val();
    console.log('Get course number load lines' + courseID);
    let lines = await helpers.getCourseLines(courseID);
    enterLines(lines);
}

async function init(reason) {
    console.log('Controller init' + reason);
    let courses = await helpers.getCourses();
    await dropDownHelper.populateCourseDropDown(courses);
    console.log('Controller before UI');
    $('.ui.dropdown').dropdown();
    $('.button.choose-course').click(function (e) {
	chooseCourse();
	e.preventDefault();
	return false;
    });
}

export default {
    init: init
};

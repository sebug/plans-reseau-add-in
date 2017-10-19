/* global $, Office, Excel */
import helpers from "helpers";
import dropDownHelper from "dropDownHelper";

async function enterLines(lines) {
    await Excel.run(function (context) {
	const tables = context.workbook.tables;
	const table = tables.getItem(0);
	const rows = table.rows;
	rows.load('items');
	return context.sync().then(function () {
	    console.log('row count: ' + rows.count);
	});
    });
    console.log(Office.context);
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

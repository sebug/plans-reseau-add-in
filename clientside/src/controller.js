/* global $ */
import getCourses from "helpers";
import dropDownHelper from "dropDownHelper";

async function chooseCourse() {
    const courseID = $('.cours-dropdown input[name="cours"]').val();
    console.log('Get course number load lines' + courseID);
}

async function init(reason) {
    console.log('Controller init' + reason);
    let courses = await getCourses();
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

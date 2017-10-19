/* global $, Office */
import getCourses from "helpers";
import dropDownHelper from "dropDownHelper";

Office.initialize = function (reason) {
    console.log(reason);
    $('.ui.dropdown').dropdown();

    getCourses().then(function (courses) {
	return dropDownHelper.populateCourseDropDown(courses);
    });
};





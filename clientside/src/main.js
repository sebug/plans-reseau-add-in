/* global $, Office */
import getCourses from "helpers";

Office.initialize = function (reason) {
    console.log(reason);
    $('.ui.dropdown').dropdown();

    getCourses().then(function (courses) {
	if (courses && courses.length) {
	    for (let course of courses) {
		var title = course.CourseType + ' - ' + course.Name;
		$('.cours-dropdown .menu').append('<div class="item" data-value="' + course.Number + '">' + title + '<div>');
	    }
	}
    });
};





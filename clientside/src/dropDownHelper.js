/*global $*/
async function populateCourseDropDown(courses) {
    console.log('Populating course dropdown');
    if (courses && courses.length) {
	for (let course of courses) {
	    var title = course.CourseType + ' - ' + course.Name;
	    $('.cours-dropdown .menu').append('<div class="item" data-value="' + course.Number + '">' + title + '<div>');
	}
    }
}

export default {
    populateCourseDropDown: populateCourseDropDown
};

/* global $ */
import getCourses from "helpers";
import dropDownHelper from "dropDownHelper";

async function init(reason) {
    console.log('Controller init' + reason);
    let courses = await getCourses();
    await dropDownHelper.populateCourseDropDown(courses);
    console.log('Controller before UI');
    $('.ui.dropdown').dropdown();
}

export default {
    init: init
};

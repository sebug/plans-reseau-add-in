/* global fetch */
async function getCourses() {
    var res = await fetch('/api/AddInEntryTrigger', {
	credentials: 'include'
    });
    return res.json();
}

async function getCourseLines(number) {
    var res = await fetch('/api/CourseLinesTrigger?number=' + number, {
	credentials: 'include'
    });
    return res.json();
}

export default {
    getCourses: getCourses,
    getCourseLines: getCourseLines
};

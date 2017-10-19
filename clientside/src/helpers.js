/* global fetch */
async function getCourses() {
    var res = await fetch('/api/AddInEntryTrigger', {
	credentials: 'include'
    });
    return res.json();
}

export default getCourses;

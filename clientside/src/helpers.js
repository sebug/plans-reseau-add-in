/* global fetch */
async function getX() {
    var res = await fetch('/api/AddInEntryTrigger', {
	credentials: 'include'
    });
    return res.text();
}

export default getX;

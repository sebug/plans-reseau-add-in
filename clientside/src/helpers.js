/* global fetch */
async function getX() {
    var res = await fetch('index.html');
    return res.text();
}

export default getX;

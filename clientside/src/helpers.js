/* global fetch */
async function getX() {
    await fetch('index.html');
    return 43;
}

export default getX;

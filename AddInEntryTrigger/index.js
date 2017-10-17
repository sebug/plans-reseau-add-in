module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    context.res = {
	body: "Oh, hey world"
    };
    context.done();
};

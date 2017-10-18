module.exports = function (context, req) {
    context.log('Requested Add-in entry.');

    context.log('Headers ' + JSON.stringify(req.headers));

    context.res = {
	body: "Oh, hey world"
    };
    context.done();
};

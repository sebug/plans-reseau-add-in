/* global ko, $ */
import getX from "helpers";

getX().then(function (x) {
    $(document).ready(function () {
	$('.button.login').click(function () {
	    var userName = $('#username').val();
	    var password = $('#password').val();
	    console.log({
		userName: userName,
		password: password
	    });
	    return false;
	});
    });
});



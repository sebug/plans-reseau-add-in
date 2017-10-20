/* global $, Office, Excel, OfficeExtension */
import helpers from "helpers";
import dropDownHelper from "dropDownHelper";

function findIndex(values, str) {
    for (let y = 0; y < values.length; y += 1) {
	let row = values[y];
	for (let x = 0; x < row.length; x += 1) {
	    let cell = row[x];
	    if (typeof cell === 'string' && cell.indexOf(str) >= 0) {
		return {
		    x: x,
		    y: y
		};
	    }
	}
    }
}

function extractRadioContent(values, yStart, xStart, xEnd) {

    // First, let's extract the header fields
    const headerLookup = {};
    const headerRow = values[yStart];
    for (let x = xStart; x <= xEnd; x += 1) {
	headerLookup[x] = headerRow[x] || ('Empty' + x);
    }

    // Iterate through the rows until we find the first one that's empty on the leftmost column we find interesting
    const result = [];
    for (let y = yStart + 1; y < values.length && values[y][xStart]; y += 1) {
	let row = values[y];
	const obj = {};
	for (let x = xStart; x <= xEnd; x += 1) {
	    obj[headerLookup[x]] = row[x];
	    if (x === xEnd) {
		// that's also, by definition, the identifier col
		obj.Identifier = row[x];
	    }
	    if (headerLookup[x] === 'Fonction') {
		obj.Function = row[x];
	    }
	    if (x === xStart + 1) {
		obj.Name = row[x];
	    }
	}
	obj.RowNumber = y;
	result.push(obj);
    }

    return result;
}

function createIdentifierMap(lines) {
    const result = {};
    for (let o of lines) {
	result[o.Identifier] = o;
    }
    return result;
}

function emptyOutRow(row, xStart, xEnd) {
    for (let x = xStart + 1; x < xEnd; x += 1) {
	row[x] = '';
    }
}

function fillRow(row, xStart, xEnd, radio) {
    let distance = xEnd - xStart;
    if (distance < 3) {
	row[xStart + 1] = radio.Name || radio.Function || '';
    } else {
	row[xStart + 1] = radio.Name || '';
	row[xStart + 2] = radio.Function || '';
    }
}

async function enterLines(lines) {
    await Excel.run(async function (context) {
	try {
	    const sheet = context.workbook.worksheets.getFirst();
	    sheet.activate();
	    sheet.load('name');
	    await context.sync();
	    console.log(`The active worksheet is "${sheet.name}"`);

	    const usedRange = sheet.getUsedRange();
	    usedRange.load('address');
	    await context.sync();

	    console.log(usedRange.address);

	    // Now that we have the range we can get the values
	    usedRange.load('values');

	    await context.sync();

	    const newValues = usedRange.values.map(function (row) {
		return row.map(function (cell) {
		    return cell;
		});
	    });

	    const leftTop = findIndex(newValues, 'IIII');

	    const indicatif = findIndex(newValues, 'Indicatif');

	    const radioContent = extractRadioContent(newValues, leftTop.y, leftTop.x, indicatif.x);

	    const lineMap = createIdentifierMap(lines);

	    for (let radio of radioContent) {
		if (lineMap[radio.Identifier]) {
		    fillRow(newValues[radio.RowNumber], leftTop.x, indicatif.x, lineMap[radio.Identifier]);
		} else {
		    emptyOutRow(newValues[radio.RowNumber], leftTop.x, indicatif.x);
		}
	    }

	    console.log(newValues);

	    usedRange.values = newValues;

	    await context.sync();

	    return true;
	} catch (error) {
	    console.log("Error: " + error);
	    if (error instanceof OfficeExtension.Error) {
		console.log("Debug info: " + JSON.stringify(error.debugInfo));
	    }
	}
    });
}

async function chooseCourse() {
    const courseID = $('.cours-dropdown input[name="cours"]').val();
    console.log('Get course number load lines' + courseID);
    let lines = await helpers.getCourseLines(courseID);
    enterLines(lines);
}

async function init(reason) {
    console.log('Controller init' + reason);
    let courses = await helpers.getCourses();
    await dropDownHelper.populateCourseDropDown(courses);
    console.log('Controller before UI');
    $('.ui.dropdown').dropdown();
    $('.button.choose-course').click(function (e) {
	chooseCourse();
	e.preventDefault();
	return false;
    });
}

export default {
    init: init
};

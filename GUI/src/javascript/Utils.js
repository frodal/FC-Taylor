////////////////////////////////////////////////////////////////////////////////////
//                                   Utilities                                    //
////////////////////////////////////////////////////////////////////////////////////

function linspace(startValue, endValue, cardinality) {
    var arr = new Array(cardinality);
    var step = (endValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; ++i) {
        arr[i] = startValue + (step * i);
    }
    return arr;
}

// Function to call so that the event loop is not blocked, i.e., cycle the event loop
function setImmediatePromise() {
    return new Promise((resolve) => {
        setImmediate(() => resolve());
    });
}

function isPositiveNumber(num) {
    return isNumber(num) && parseFloat(num) > 0;
}


function isNonNegativeNumber(num) {
    return isNumber(num) && parseFloat(num) >= 0;
}


function isNumber(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
}

// Exports
exports.linspace = linspace;
exports.setImmediatePromise = setImmediatePromise;
exports.isPositiveNumber = isPositiveNumber;
exports.isNonNegativeNumber = isNonNegativeNumber;
exports.isNumber = isNumber;

'use strict';
function log(target, propertyKey, descriptor) {
    var originalMethod = descriptor.value; // save a reference to the original method
    // NOTE: Do not use arrow syntax here. Use a function expression in
    // order to use the correct value of `this` in this method (see notes below)
    descriptor.value = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        console.log("The method args are: " + JSON.stringify(args)); // pre
        var result = originalMethod.apply(this, args); // run and store the result
        console.log("The return value is: " + result); // post
        return result; // return the result of the original method
    };
    return descriptor;
}
exports.log = log;
function logWithName(name) {
    if (name === void 0) { name = 'Gustav'; }
    return function (target, propertyKey, descriptor) {
        var originalMethod = descriptor.value; // save a reference to the original method
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i - 0] = arguments[_i];
            }
            var observable = originalMethod.apply(this, args);
            observable.forEach(
            // Regular
            // Regular
            function (datum) { return console.log(name, datum); }, 
            // Errors
            // Errors
            function (err) { return console.error(name, err); }, 
            // Done
            // Done
            function () { return console.log(name, 'Finished'); });
            return observable;
        };
        return descriptor;
    };
}
exports.logWithName = logWithName;

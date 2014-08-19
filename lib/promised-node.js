
var blinkts = require("blinkts-lang");

function load(module) {

var toTransform;

if (typeof moduleName === "string") {
    toTransform = require(module);
} else {
    toTransform = module;
}

/**
 * Check is a function is async or not.
 */
function isFunctionAsync(_thisObject, name, fn) {
    return (!/Sync$/.test(name) && (typeof _thisObject[name + "Sync"] === "function"));
}

/**
 * Can this function be wrapped around a promise? Only sync/async functions are eligible
 * for this.
 */
function isFunctionPromiseable(_thisObject, name, fn) {
     if (/Sync$/.test(name)) {
          return typeof _thisObject[ name.substring(0, name.length - 4) ] === "function";
     } else {
          return typeof _thisObject[ name + "Sync" ] === "function";
     }
}

/**
 * Takes the current function and wraps it around a promise.
 */
function rebuildAsPromise(_thisObject, name, fn) {
    // if is a regular function, that has an async correspondent also make it promiseable
    if (!isFunctionAsync(_thisObject, name, fn)) {
        return function() {
            var that = this,
                args = arguments;

            return blinkts.lang.promiseCode(function() {
                return fn.apply(that, args);
            });
        };
    }

    // if it's an async function, make it promiseable.
    return function() {
        var result = new blinkts.lang.Promise(),
            args = Array.prototype.slice.apply(arguments),
            that = this;

        args.push(function(err, r) {
            if (err) {
                result.reject(err);
            }

            if (arguments.length > 2) { // if the callback received multiple arguments, put them into an array.
                result.fulfill(Array.prototype.slice.apply(arguments, 1));
            } else {
                result.fulfill(r);
            }
        });

	try {
            fn.apply(that, args);
        } catch (e) { // if the function failed, so we don't get a chance to get our callback called.
            result.reject(e);
        }
        
        return result;
    };
}

for (var item in toTransform) {
    // transform only sync/async methods to promiseable since having utility methods also promiseable
    // could do more harm than good.
    if (typeof toTransform[item] === "function" && isFunctionPromiseable( toTransform, item, toTransform[item] )) {
        toTransform[item] = rebuildAsPromise( toTransform, item, toTransform[item] );
    }
}

return toTransform;

}

exports.load = load;


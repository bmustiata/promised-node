var blinkts = require("blinkts-lang");

/**
 * Load a module transforming all the async methods that have callbacks
 * into promises enabled functions.
 * @param {string|object} module The module name, or the object to transform its functions.
 * @return {object} Loaded module with methods transformed.
 */
function load(module) {
    var toTransform,
		transformedModule = {};

    if (typeof module === "string") {
        toTransform = require(module);
    } else {
        toTransform = module;
    }

    for (var item in toTransform) {
        // transform only sync/async methods to promiseable since having utility methods also promiseable
        // could do more harm than good.
        if (typeof toTransform[item] === "function" && isFunctionPromiseable( toTransform, item, toTransform[item] )) {
            transformedModule[item] = rebuildAsPromise( toTransform, item, toTransform[item] );
        } else {
			transformedModule[item] = toTransform[item];
		}
    }

    return transformedModule;
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
		var args = Array.prototype.slice.apply(arguments),
			that = this;

		return new blinkts.lang.Promise(function(fulfill, reject) {
			args.push(function(err, r) {
				if (err) {
					reject(err);
				}

				if (arguments.length > 2) { // if the callback received multiple arguments, put them into an array.
					fulfill(Array.prototype.slice.call(arguments, 1));
				} else {
					fulfill(r);
				}
			});

			try {
				var result = fn.apply(that, args);
			} catch (e) { // if the function failed, so we don't get a chance to get our callback called.
				reject(e);
			}
		});
    };
}

exports.load = load;
exports.promise = blinkts.lang.promise;
exports.promises = blinkts.lang.promises;
exports.promiseCode = blinkts.lang.promiseCode;
exports.Promise = blinkts.lang.Promise;

promised-node
=============

Allow loading existing node modules with callbacks as promises modules.

How it works is by scanning the module for functions that have the same name
also with a Sync suffix (e.g. readdir and readdirSync), and then replaces them
with a function that doesn't have the last callback parameter, but
instead returns a promise.

Promises are fully conformant to the APlus promises spec:
https://github.com/promises-aplus/promises-spec

Here is an example:

```javascript
var fs = require("promised-node").load("fs");

fs.readdir(".").then(function(files) {
    files.forEach(function(name) {
        console.log(name);
    });
});
```
If the callback method receives multiple arguments, they will be sent
into an Array into the fulfillment of the promise.

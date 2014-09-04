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
into an Array into the fulfillment of the promise:

```javascript
var fs = require("promised-node").load("fs");

var fd;

fs.open("test.txt", "w").then(function(_fd) {         // open the file
    fd = _fd;
    return fs.write(fd, new Buffer("test"), 0, 4, 0); // write 4 bytes
}).then(function(data) {
    console.log("written: ", data);
    return fs.close(fd);                              // close the file
}).then(null, function(e) {
    console.log("Something terrible happened: ", e);
});
```

As you can notice, since now we're using promises, writing async code
becomes far simpler now.

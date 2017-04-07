const lib = require('../lib/app.js');

lib.main();
setInterval(lib.main, lib.TIMEOUT_INTERVAL * 1000 * 60);
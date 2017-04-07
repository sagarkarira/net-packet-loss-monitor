#!/usr/bin/env node

'use strict';
const path = require('path');
const lib = require(path.join(__dirname, '../lib/app.js'));

lib.main();
setInterval(lib.main, lib.TIMEOUT_INTERVAL * 1000 * 60);
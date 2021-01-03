'use strict';

const path = require('path');
var app = require('./index.js');

let rootPath = path.join(__dirname, '../');

require('greenlock-express')
    .init({
        packageRoot: rootPath,

        // contact for security and critical bug notices
        maintainerEmail: "test@example.com",

        // where to look for configuration
        configDir: './greenlock.d',

        // whether or not to run at cloudscale
        cluster: false
    })
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(app);
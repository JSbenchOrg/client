"use strict";
var App_1 = require('./App');
var serverUri = window.location.host === 'jsbench.org' ? 'http://api.jsbench.org/v2' : 'http://api-dev.jsbench.org/v2';
var clientUri = 'http://' + window.location.host;
new App_1.App({
    serverUri: serverUri,
    clientUri: clientUri
});
//# sourceMappingURL=index.js.map
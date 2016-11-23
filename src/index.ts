import {App} from './App';

let serverUri = window.location.host === 'jsbench.org' ? 'http://api.jsbench.org/v2' : 'http://api-dev.jsbench.org/v2';
let clientUri = 'http://' + window.location.host;

new App({
    serverUri: serverUri,
    clientUri:  clientUri
});

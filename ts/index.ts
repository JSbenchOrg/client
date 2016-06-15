import {App} from './App';

let app = new App({
    serverUri: 'http://api.jsbench.org',
    clientUri: 'http://' + window.location.host
});
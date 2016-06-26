import {App} from './App';

new App({
    serverUri: 'http://api-dev.jsbench.org/v2',
    clientUri: 'http://' + window.location.host
});

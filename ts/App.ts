import {Http} from './Http';
import {Page} from './Page';
import {TestCase, TestCaseEntityInterface} from './TestCase';
import Promise = Q.Promise;

export class App {
    public static config: AppConfigInterface;
    public static http: Http;

    public constructor(config: AppConfigInterface) {
        console.log('App starting ...');
        App.config = config;
        App.http = new Http();
        this.registerHandlebarsHelpers();

        App.router();
    }

    protected static router(): Promise<Page> {
        var path = window.location.pathname;
        var fragments = path.split('/');
        var entity = fragments[1];
        var slug = fragments[2];

        if (entity === 'test') {
            return App.http.getJSON(`${App.config.clientUri}/test/${slug}.json`).then(function (r) {
                var testCase = new TestCase(<TestCaseEntityInterface>r.getBody());
                return new Page(testCase);
            });
        } else {
            return Q.fcall(function() {
                var testCase = new TestCase(TestCase.createEmpty());
                return new Page(testCase);
            });
        }
    }

    protected registerHandlebarsHelpers() {
        Handlebars.registerHelper('if_eq', function(a: any, b: any, opts: any) {
            if (a === b) {
                return opts.fn(this);
            } else {
                return opts.inverse(this);
            }
        });

        Handlebars.registerHelper('timestamp', function() {
            return (new Date()).getTime();
        });
    }

    protected bindErrorLogging() {
        if (!('onerror' in window)) {
            return false;
        }

        var timeStamp = (new Date()).getTime();

        window.onerror = function(msg, url, lineNo, columnNo, error) {

            var diff = (new Date()).getTime() - timeStamp;
            var minutesDifference = Math.floor(diff / 1000 / 60);

            console.log('Minutes difference: ', minutesDifference);

            var errorDTO = {
                msg: msg,
                url: url || window.location.href,
                lineNo: lineNo,
                colNo: columnNo,
                trace: error.toString()
            };

            App.http.postJSON(`App.config.clientUri/log.json`, errorDTO).then(function() {
                timeStamp = (new Date()).getTime();
            });
        };
    };
}

interface AppConfigInterface {
    serverUri: string;
    clientUri: string;
}

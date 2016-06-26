import {Http, HttpResponseInterface} from './Http';
import {Page} from './Page';
import {TestCase, TestCaseEntity} from './TestCase';
import {Router} from './Router';

export class App {
    public static config: AppConfigInterface;
    public static http: Http;
    public router: Router;

    public constructor(config: AppConfigInterface) {
        console.log('App starting ...');
        App.config = config;
        App.http = new Http();
        this.router = new Router();
        this.registerHandlebarsHelpers();

        // Add 'default' routes.
        this.router.addRoute('/', function() {
            Q.fcall(function() {
                var testCase = new TestCase(TestCase.createEmptyEntity());
                return new Page(testCase);
            }).then(function(page: Page) {
                page.render();
            });
        });

        this.router.addRoute('/test/{slug}', function(slug: string) {
            return App.http.getJSON(`${App.config.serverUri}/test/${slug}.json`).then(function (r: HttpResponseInterface) {
                var testCase = new TestCase(<TestCaseEntity>r.getBody());
                return new Page(testCase);
            }).then(function(page: Page) {
                page.render();
            });
        });

        this.router.run();
    }

    protected registerHandlebarsHelpers() {
        Handlebars.registerHelper('if_eq', function(a: any, b: any, opts: any) {
            if (a === b) {
                return opts.fn(this);
            } else {
                return opts.inverse(this);
            }
        });

        Handlebars.registerHelper('if_sm', function(a: any, b: any, opts: any) {
            if (a < b) {
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

            App.http.postJSON(`${App.config.serverUri}/log.json`, errorDTO).then(function() {
                timeStamp = (new Date()).getTime();
            });
        };
    };
}

interface AppConfigInterface {
    serverUri: string;
    clientUri: string;
}

"use strict";
var Http_1 = require('./Http');
var Page_1 = require('./Page');
var TestCase_1 = require('./TestCase');
var Router_1 = require('./Router');
var App = (function () {
    function App(config) {
        console.log('App starting ...');
        App.config = config;
        App.http = new Http_1.Http();
        this.router = new Router_1.Router();
        this.registerHandlebarsHelpers();
        this.router.addRoute('/', function () {
            Q.fcall(function () {
                var testCase = new TestCase_1.TestCase(TestCase_1.TestCase.createEmptyEntity());
                return new Page_1.Page(testCase);
            }).then(function (page) {
                page.render();
            });
        });
        this.router.addRoute('/test/{slug}', function (slug) {
            return App.http.getJSON(App.config.serverUri + "/test/" + slug + ".json").then(function (r) {
                var testCase = new TestCase_1.TestCase(r.getBody());
                return new Page_1.Page(testCase);
            }).then(function (page) {
                page.render();
            });
        });
        this.router.run().then(function (a) {
            console.log('Page rendered.');
        }, function (error) {
            Page_1.Page.renderErrorPopup(error.message);
            window.location.href = '/';
        });
    }
    App.prototype.registerHandlebarsHelpers = function () {
        Handlebars.registerHelper('if_eq', function (a, b, opts) {
            if (a === b) {
                return opts.fn(this);
            }
            else {
                return opts.inverse(this);
            }
        });
        Handlebars.registerHelper('if_gt', function (a, b, opts) {
            if (a > b) {
                return opts.fn(this);
            }
            else {
                return opts.inverse(this);
            }
        });
        Handlebars.registerHelper('timestamp', function () {
            return (new Date()).getTime();
        });
    };
    App.prototype.bindErrorLogging = function () {
        if (!('onerror' in window)) {
            return false;
        }
        var timeStamp = (new Date()).getTime();
        window.onerror = function (msg, url, lineNo, columnNo, error) {
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
            App.http.postJSON(App.config.serverUri + "/log.json", errorDTO).then(function () {
                timeStamp = (new Date()).getTime();
            });
        };
    };
    ;
    return App;
}());
exports.App = App;
//# sourceMappingURL=App.js.map
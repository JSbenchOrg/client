(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./Http":2,"./Page":3,"./Router":4,"./TestCase":6}],2:[function(require,module,exports){
"use strict";
var Http = (function () {
    function Http() {
    }
    Http.fromStringToJSON = function (str) {
        return str ? JSON.parse(str) : {};
    };
    Http.fromJSONToString = function (jsonObj) {
        return JSON.stringify(jsonObj);
    };
    Http.contentTypeIsJSON = function (header) {
        if (!header) {
            return false;
        }
        return !!header.match(/application\/json/i);
    };
    Http.prototype.sendRequest = function (request) {
        var deferred = Q.defer();
        var xhr = typeof XMLHttpRequest !== 'undefined' ? new XMLHttpRequest() : null;
        xhr.open(request.getMethod(), request.getUrl(), true);
        (function (headers) {
            for (var i in headers) {
                if (headers.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, headers[i]);
                }
            }
        })(request.getHeaders());
        var _response = this._response;
        xhr.onload = function () {
            if (xhr.readyState === Http.XHR_DONE) {
                _response = new Response(xhr.status, xhr.response);
                if (Http.contentTypeIsJSON(this.getResponseHeader('content-type'))) {
                    _response.setBody(Http.fromStringToJSON(_response.getBodyRaw()));
                }
                if (xhr.status === Http.HTTP_SUCCESS || xhr.status === Http.HTTP_CREATED) {
                    deferred.resolve(_response);
                }
                else {
                    deferred.reject(_response);
                }
            }
        };
        if (request.getBody()) {
            xhr.send(request.getBody());
        }
        else {
            xhr.send();
        }
        return deferred.promise;
    };
    Object.defineProperty(Http.prototype, "request", {
        get: function () {
            return this._request;
        },
        set: function (request) {
            this._request = request;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Http.prototype, "response", {
        get: function () {
            return this._response;
        },
        set: function (response) {
            this._response = response;
        },
        enumerable: true,
        configurable: true
    });
    Http.prototype.send = function (method, url, body) {
        return this.sendRequest(new Request(method, url, null, body));
    };
    Http.prototype.getJSON = function (url) {
        return this.sendRequest(new Request('GET', url, { 'Content-Type': 'application/json', 'Accept': 'application/json' }, null)).then(function (response) {
            return response;
        });
    };
    ;
    Http.prototype.postJSON = function (url, body) {
        var bodyString = Http.fromJSONToString(body);
        return this.sendRequest(new Request('POST', url, { 'Content-Type': 'application/json', 'Accept': 'application/json' }, bodyString)).then(function (response) {
            return response;
        });
    };
    ;
    Http.prototype.getHTML = function (url) {
        return this.sendRequest(new Request('GET', url, { 'Content-Type': 'text/html', 'Accept': 'text/html' }, null));
    };
    ;
    Http.HTTP_SUCCESS = 200;
    Http.HTTP_CREATED = 201;
    Http.HTTP_NOT_FOUND = 404;
    Http.HTTP_BAD_REQUEST = 400;
    Http.XHR_UNSENT = 0;
    Http.XHR_OPENED = 1;
    Http.XHR_HEADERS_RECEIVED = 2;
    Http.XHR_LOADING = 3;
    Http.XHR_DONE = 4;
    return Http;
}());
exports.Http = Http;
var Request = (function () {
    function Request(method, url, headers, body) {
        this.method = method;
        this.url = url;
        this.headers = headers || {};
        this.body = body;
    }
    ;
    Request.prototype.getMethod = function () {
        return this.method;
    };
    ;
    Request.prototype.getUrl = function () {
        return this.url;
    };
    ;
    Request.prototype.getHeaders = function () {
        return this.headers;
    };
    ;
    Request.prototype.getBody = function () {
        return this.body;
    };
    ;
    return Request;
}());
var Response = (function () {
    function Response(status, body) {
        this.status = status;
        this.body = body;
        this.bodyRaw = body;
    }
    ;
    Response.prototype.setStatus = function (status) {
        this.status = status;
    };
    ;
    Response.prototype.getStatus = function () {
        return this.status;
    };
    ;
    Response.prototype.setBody = function (body) {
        this.body = body;
    };
    ;
    Response.prototype.getBody = function () {
        return this.body;
    };
    ;
    Response.prototype.getBodyRaw = function () {
        return this.bodyRaw;
    };
    return Response;
}());

},{}],3:[function(require,module,exports){
"use strict";
var TestCase_1 = require('./TestCase');
var App_1 = require('./App');
var Runner_1 = require('./Runner');
var TotalChartPanel_1 = require('./TotalChartPanel');
var Page = (function () {
    function Page(testCase) {
        console.log('TestCase constructor ...');
        this.testCase = testCase;
    }
    Page.renderElem = function (id, html, data) {
        var $elem = document.getElementById(id);
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    };
    Page.prototype.render = function () {
        var _this = this;
        Q.spread([
            App_1.App.http.getJSON(App_1.App.config.serverUri + '/tests.json?exclude=revision_number,description,harness,entries,status&orderBy=latest&limit=25'),
            App_1.App.http.getHTML(App_1.App.config.clientUri + '/tpl/testcase-sidebar-listing.hbs')
        ], function (dataR, tplR) {
            Page.renderElem('sidebar-listing', tplR.getBody(), dataR.getBody());
        });
        Q.spread([
            App_1.App.http.getHTML(App_1.App.config.clientUri + '/tpl/testcase-entry-form.hbs'),
            App_1.App.http.getHTML(App_1.App.config.clientUri + '/tpl/testcase-main-form.hbs')
        ], function (tplEntryR, tplMainR) {
            Handlebars.registerPartial('entry', tplEntryR.getBody());
            Page.renderElem('testcase-main-form', tplMainR.getBody(), _this.testCase);
        }).then(function () {
            _this.bindSaveBtn();
            _this.bindAddTestEntryBtn();
            _this.bindRunBtn();
        });
    };
    Page.renderErrorPopup = function (error) {
        var msgTxt = 'Some kind of error occurred.';
        if (typeof error === 'object' && typeof error.error !== 'undefined' && error.error.message) {
            msgTxt = error.error.message;
        }
        else if (typeof error === 'string') {
            msgTxt = error;
        }
        window.alert(msgTxt);
    };
    Page.prototype.renderChartPanel = function () {
        var panel = new TotalChartPanel_1.TotalChartPanel(this, this.testCase);
        panel.getData().then(function (r) {
            panel.render(r.getBody());
        }, function (response) {
            Page.renderErrorPopup(response.getBody());
        });
    };
    ;
    Page.prototype.bindSaveBtn = function () {
        var $saveBtn = document.getElementById('save-testcase-button');
        $saveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            Page.toggleRenderBtn('save-testcase-button', 'disable');
            var testCaseDTO = TestCase_1.TestCase.createEntityFromDOMElement('testcase-main-form');
            testCaseDTO.env = {
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };
            App_1.App.http.postJSON(App_1.App.config.serverUri + '/tests.json', testCaseDTO)
                .then(function () {
                Page.toggleRenderBtn('save-testcase-button', 'activate');
            }, function (response) {
                Page.toggleRenderBtn('save-testcase-button', 'activate');
                Page.renderErrorPopup(response.getBody());
            });
        });
    };
    Page.prototype.bindRunBtn = function () {
        var _page = this;
        var $runBtn = document.getElementById('run-testcase-button');
        $runBtn.addEventListener('click', function (e) {
            e.preventDefault();
            Page.toggleRenderBtn('run-testcase-button', 'disable');
            var testCaseDTO = TestCase_1.TestCase.createEntityFromDOMElement('testcase-main-form');
            testCaseDTO.env = {
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };
            App_1.App.http.getHTML(App_1.App.config.clientUri + "/tpl/testcase-results-table.hbs")
                .then(function (r) {
                Page.renderElem('results', r.getBody(), testCaseDTO);
                var runner = new Runner_1.Runner(new TestCase_1.TestCase(testCaseDTO));
                runner.run().then(function (results) {
                    Page.toggleRenderBtn('run-testcase-button', 'activate');
                    _page.sendResults(results).then(function () {
                        console.log('Rendering Chart Panel ...');
                        _page.renderChartPanel();
                    });
                }, function (error) {
                    Page.renderErrorPopup(error);
                });
            });
        }, false);
    };
    Page.prototype.bindAddTestEntryBtn = function () {
        var _this = this;
        var $btn = document.getElementById('add-test-link');
        $btn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('click?');
            App_1.App.http.getHTML(App_1.App.config.clientUri + "/tpl/testcase-entry-form.hbs").then(function (response) {
                var entryId = Page.getNextTestCaseEntryId();
                var newTestEntry = TestCase_1.TestCase.createEmptyTestCaseEntry(entryId);
                _this.testCase.addEntry(newTestEntry);
                var template = Handlebars.compile(response.getBody());
                var html = template(newTestEntry);
                var $newEntry = document.createElement('div');
                $newEntry.innerHTML = html;
                var $entries = document.getElementById('entries');
                $entries.appendChild($newEntry.firstChild);
                _this.bindRemoveTestEntryBtn(entryId);
            });
        });
    };
    ;
    Page.prototype.bindRemoveTestEntryBtn = function (entryId) {
        var _this = this;
        var $entries = document.getElementById('entries');
        var $entry = document.getElementById('testcase-test-' + entryId);
        var $button = $entry.getElementsByClassName('testcase-test-remove');
        $button[0].addEventListener('click', function (e) {
            console.log('click?');
            _this.testCase.removeEntry(entryId);
            $entries.removeChild($entry);
        });
    };
    ;
    Page.getNextTestCaseEntryId = function () {
        return document.getElementsByClassName('testcase-test').length + 1;
    };
    Page.toggleRenderBtn = function (id, status) {
        var $btn = document.getElementById(id);
        if (status === 'activate') {
            $btn.classList.remove('btn-loading');
            $btn.disabled = false;
        }
        else {
            $btn.className += ' btn-loading';
            $btn.disabled = true;
        }
    };
    Page.prototype.sendResults = function (results) {
        var testCaseDTO = TestCase_1.TestCase.createEntityFromDOMElement('testcase-main-form');
        for (var i in results) {
            if (!results.hasOwnProperty(i)) {
                continue;
            }
            testCaseDTO.entries[i].results = results[i];
        }
        testCaseDTO.env = {
            browserName: platform.name,
            browserVersion: platform.version,
            os: platform.os
        };
        console.log(testCaseDTO, JSON.stringify(testCaseDTO));
        this.testCase = TestCase_1.TestCase.create(testCaseDTO);
        return App_1.App.http.postJSON(App_1.App.config.serverUri + "/tests.json", testCaseDTO);
    };
    ;
    return Page;
}());
exports.Page = Page;

},{"./App":1,"./Runner":5,"./TestCase":6,"./TotalChartPanel":7}],4:[function(require,module,exports){
"use strict";
var Router = (function () {
    function Router() {
        this.routes = [];
    }
    Router.prototype.run = function (customPath) {
        var deferred = Q.defer();
        var path = customPath ? customPath : window.location.pathname;
        var route = this.matchRoute(path);
        if (route) {
            deferred.resolve(route.action.apply(null, route.args));
        }
        else {
            deferred.reject(new Error('No valid route found.'));
        }
        return deferred.promise;
    };
    Router.prototype.addRoute = function (path, action) {
        if (!path || !action) {
            return false;
        }
        this.routes.push({
            path: path,
            action: action
        });
    };
    Router.prototype.matchRoute = function (path) {
        var matchFound;
        var preparedPath;
        for (var i = 0; i < this.routes.length; i++) {
            preparedPath = "^" + Router.preparePath(this.routes[i].path) + "$";
            matchFound = path.match(new RegExp(preparedPath, 'i'));
            if (matchFound) {
                var args = matchFound.slice(1, matchFound.length);
                return {
                    path: this.routes[i].path,
                    action: this.routes[i].action,
                    args: args,
                    requestedPath: path
                };
            }
        }
    };
    Router.preparePath = function (path) {
        return path.replace(/{[a-z]+}/g, '([a-z0-9-]+)');
    };
    return Router;
}());
exports.Router = Router;

},{}],5:[function(require,module,exports){
"use strict";
var Runner = (function () {
    function Runner(testCase) {
        this.testCase = testCase;
    }
    Runner.prototype.run = function () {
        if (!this.testCase.isReadyToRun()) {
            throw new Error('You need to have at least two code entries in order to run the test case.');
        }
        console.log('Starting runner ...');
        return this.startBench();
    };
    Runner.prototype.startBench = function () {
        var deferredQ = Q.defer();
        var testCase = this.testCase;
        var benches = [];
        var bench;
        var results = {};
        for (var j in testCase.entries) {
            if (!testCase.entries.hasOwnProperty(j)) {
                continue;
            }
            bench = new Benchmark(testCase.entries[j].title, {
                id: j,
                async: true,
                setup: testCase.harness.setUp,
                teardown: testCase.harness.tearDown,
                fn: testCase.entries[j].code,
                onStart: function (e) {
                    var benchResult = e.target;
                    Runner.renderResult(benchResult.id, 'Starting ...');
                },
                onComplete: function (e) {
                    var benchResult = e.target;
                    results[benchResult.id] = {
                        id: benchResult.id,
                        error: benchResult.error ? Benchmark.join(benchResult.error) : null,
                        opsPerSec: benchResult.hz.toFixed(benchResult.hz < 100 ? 2 : 0),
                        opsPerSecFormatted: Benchmark.formatNumber(benchResult.hz.toFixed(benchResult.hz < 100 ? 2 : 0)),
                        pm: benchResult.stats.rme.toFixed(2),
                        runSamples: benchResult.stats.sample.length
                    };
                    Runner.renderResult(benchResult.id, results[benchResult.id].opsPerSecFormatted + ' (&plusmn;' + results[benchResult.id].pm + ')');
                }
            });
            benches.push(bench);
        }
        setTimeout(function () {
            Benchmark.invoke(benches, {
                name: 'run',
                args: true,
                onStart: function (e) {
                    console.log('Starting benchmarks ...', e);
                },
                onCycle: function (e) {
                    console.log('onCycle here.', e);
                },
                onError: function (e) {
                    console.log('onError here.', e);
                    deferredQ.reject(new Error('Running suite returned an error.'));
                },
                onComplete: function (e) {
                    console.log('onComplete here.', e, results);
                    Runner.renderWinnerResult(Benchmark.filter(benches, 'fastest')[0].id);
                    Runner.renderLoserResult(Benchmark.filter(benches, 'slowest')[0].id);
                    deferredQ.resolve(results);
                }
            });
        }, 2000);
        return deferredQ.promise;
    };
    Runner.renderResult = function (id, text) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.innerHTML = text;
    };
    ;
    Runner.renderWinnerResult = function (id) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' success';
    };
    ;
    Runner.renderLoserResult = function (id) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' danger';
    };
    ;
    return Runner;
}());
exports.Runner = Runner;

},{}],6:[function(require,module,exports){
"use strict";
var Utils_1 = require('./Utils');
var TestCase = (function () {
    function TestCase(testCase) {
        this.title = testCase.title;
        this.slug = testCase.slug;
        this.description = testCase.description;
        this.status = testCase.status;
        this.harness = testCase.harness;
        this.entries = testCase.entries;
        this.env = testCase.env;
    }
    Object.defineProperty(TestCase.prototype, "title", {
        get: function () {
            return this._title;
        },
        set: function (title) {
            this._title = title;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "slug", {
        get: function () {
            return this._slug;
        },
        set: function (slug) {
            this._slug = slug;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "description", {
        get: function () {
            return this._description;
        },
        set: function (description) {
            this._description = description;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "status", {
        get: function () {
            return this._status;
        },
        set: function (status) {
            this._status = status;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "harness", {
        get: function () {
            return this._harness;
        },
        set: function (harness) {
            this._harness = harness;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "entries", {
        get: function () {
            return this._entries;
        },
        set: function (entries) {
            this._entries = entries;
        },
        enumerable: true,
        configurable: true
    });
    TestCase.prototype.addEntry = function (entry) {
        this._entries[entry.id] = entry;
    };
    TestCase.prototype.removeEntry = function (id) {
        delete this._entries[id];
    };
    Object.defineProperty(TestCase.prototype, "env", {
        get: function () {
            return this._env;
        },
        set: function (env) {
            this._env = env;
        },
        enumerable: true,
        configurable: true
    });
    TestCase.prototype.isReadyToRun = function () {
        return (Utils_1.Util.getObjLength(this.entries) >= 2);
    };
    TestCase.create = function (testCaseEntity) {
        return new TestCase(testCaseEntity);
    };
    TestCase.createEmptyEntity = function () {
        return {
            title: '',
            slug: Utils_1.Util.randomString(10),
            description: '',
            status: 'public',
            harness: {
                html: '',
                setUp: '',
                tearDown: ''
            },
            entries: [
                { id: 1, title: '', code: '' },
                { id: 2, title: '', code: '' }
            ]
        };
    };
    TestCase.createEntityFromDOMElement = function (id) {
        var $elem = document.getElementById(id);
        var result = formToObject($elem);
        return result.testCase;
    };
    TestCase.createEmptyTestCaseEntry = function (id) {
        return {
            id: id,
            title: '',
            code: ''
        };
    };
    return TestCase;
}());
exports.TestCase = TestCase;

},{"./Utils":8}],7:[function(require,module,exports){
"use strict";
var App_1 = require('./App');
var TotalChartPanel = (function () {
    function TotalChartPanel(page, testCase) {
        this.page = page;
        this.testCase = testCase;
    }
    TotalChartPanel.prototype.getData = function () {
        return App_1.App.http.getJSON(App_1.App.config.serverUri + "/test/" + this.testCase.slug + "/totals/by-browser.json");
    };
    TotalChartPanel.prototype.render = function (data) {
        var _this = this;
        var $chartDiv = document.getElementById('chart-results');
        if ($chartDiv.className === 'rendered') {
            this._render(data);
        }
        else {
            google.charts.load('current', { packages: ['corechart', 'bar'] });
            google.charts.setOnLoadCallback(function () {
                _this._render(data);
            });
        }
    };
    TotalChartPanel.prototype._render = function (data) {
        var $chartDiv = document.getElementById('chart-results');
        var chart = new google.visualization.BarChart($chartDiv);
        var browsers = [];
        var resultsSet = [];
        data.map(function (entry) {
            var entryResults = {
                title: entry.title
            };
            entry.totals.forEach(function (total) {
                var browserIdentifier = total.browserName;
                if (browsers.indexOf(browserIdentifier) === -1) {
                    browsers.push(browserIdentifier);
                }
                entryResults[browserIdentifier] = parseInt(total.metricValue);
            });
            resultsSet.push(_.map(entryResults));
        });
        browsers.unshift('Total');
        resultsSet.unshift(browsers);
        var options = {
            legend: {
                position: 'bottom'
            },
            bars: 'horizontal',
            chartArea: {
                width: '100%',
                height: '80%'
            }
        };
        chart.draw(google.visualization.arrayToDataTable(resultsSet), options);
        $chartDiv.className = 'rendered';
    };
    return TotalChartPanel;
}());
exports.TotalChartPanel = TotalChartPanel;

},{"./App":1}],8:[function(require,module,exports){
"use strict";
var Util = (function () {
    function Util() {
    }
    Util.randomString = function (len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz, randomPoz + 1);
        }
        return randomString;
    };
    Util.getObjLength = function (o) {
        if (typeof o !== 'object' || o === null) {
            return 0;
        }
        var l = 0;
        var k;
        if (typeof Object.keys === 'function') {
            l = Object.keys(o).length;
        }
        else {
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    l++;
                }
            }
        }
        return l;
    };
    Util.escapeForRegex = function (str) {
        return str.replace(/[-\/\\^$*+?.()|[\]]/g, '\\$&');
    };
    return Util;
}());
exports.Util = Util;

},{}],9:[function(require,module,exports){
"use strict";
var App_1 = require('./App');
var serverUri = window.location.host === 'jsbench.org' ? 'http://api.jsbench.org/v2' : 'http://api-dev.jsbench.org/v2';
var clientUri = 'http://' + window.location.host;
new App_1.App({
    serverUri: serverUri,
    clientUri: clientUri
});

},{"./App":1}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0cy9BcHAudHMiLCJ0cy9IdHRwLnRzIiwidHMvUGFnZS50cyIsInRzL1JvdXRlci50cyIsInRzL1J1bm5lci50cyIsInRzL1Rlc3RDYXNlLnRzIiwidHMvVG90YWxDaGFydFBhbmVsLnRzIiwidHMvVXRpbHMudHMiLCJ0cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUNBQSxxQkFBMEMsUUFBUSxDQUFDLENBQUE7QUFDbkQscUJBQW1CLFFBQVEsQ0FBQyxDQUFBO0FBQzVCLHlCQUF1QyxZQUFZLENBQUMsQ0FBQTtBQUNwRCx1QkFBcUIsVUFBVSxDQUFDLENBQUE7QUFFaEM7SUFLSSxhQUFtQixNQUEwQjtRQUN6QyxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDaEMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDcEIsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLFdBQUksRUFBRSxDQUFDO1FBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLEVBQUUsQ0FBQztRQUMzQixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUdqQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUU7WUFDdEIsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFDSixJQUFJLFFBQVEsR0FBRyxJQUFJLG1CQUFRLENBQUMsbUJBQVEsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7Z0JBQzFELE1BQU0sQ0FBQyxJQUFJLFdBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBUyxJQUFVO2dCQUN2QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLENBQUMsUUFB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QixFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3ZELENBQUM7SUFDTCxXQUFDO0FBQUQsQ0F6Q0EsQUF5Q0MsSUFBQTtBQXpDWSxZQUFJLE9BeUNoQixDQUFBOzs7O0FDekNELG9CQUFrQixPQUFPLENBQUMsQ0FBQTtBQUUxQixJQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxhQUFhLEdBQUcsMkJBQTJCLEdBQUcsK0JBQStCLENBQUM7QUFDdkgsSUFBSSxTQUFTLEdBQUcsU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO0FBRWpELElBQUksU0FBRyxDQUFDO0lBQ0osU0FBUyxFQUFFLFNBQVM7SUFDcEIsU0FBUyxFQUFHLFNBQVM7Q0FDeEIsQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7SHR0cCwgSHR0cFJlc3BvbnNlSW50ZXJmYWNlfSBmcm9tICcuL0h0dHAnO1xuaW1wb3J0IHtQYWdlfSBmcm9tICcuL1BhZ2UnO1xuaW1wb3J0IHtUZXN0Q2FzZSwgVGVzdENhc2VFbnRpdHl9IGZyb20gJy4vVGVzdENhc2UnO1xuaW1wb3J0IHtSb3V0ZXJ9IGZyb20gJy4vUm91dGVyJztcblxuZXhwb3J0IGNsYXNzIEFwcCB7XG4gICAgcHVibGljIHN0YXRpYyBjb25maWc6IEFwcENvbmZpZ0ludGVyZmFjZTtcbiAgICBwdWJsaWMgc3RhdGljIGh0dHA6IEh0dHA7XG4gICAgcHVibGljIHJvdXRlcjogUm91dGVyO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKGNvbmZpZzogQXBwQ29uZmlnSW50ZXJmYWNlKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdBcHAgc3RhcnRpbmcgLi4uJyk7XG4gICAgICAgIEFwcC5jb25maWcgPSBjb25maWc7XG4gICAgICAgIEFwcC5odHRwID0gbmV3IEh0dHAoKTtcbiAgICAgICAgdGhpcy5yb3V0ZXIgPSBuZXcgUm91dGVyKCk7XG4gICAgICAgIHRoaXMucmVnaXN0ZXJIYW5kbGViYXJzSGVscGVycygpO1xuXG4gICAgICAgIC8vIEFkZCAnZGVmYXVsdCcgcm91dGVzLlxuICAgICAgICB0aGlzLnJvdXRlci5hZGRSb3V0ZSgnLycsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgUS5mY2FsbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgdGVzdENhc2UgPSBuZXcgVGVzdENhc2UoVGVzdENhc2UuY3JlYXRlRW1wdHlFbnRpdHkoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQYWdlKHRlc3RDYXNlKTtcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocGFnZTogUGFnZSkge1xuICAgICAgICAgICAgICAgIHBhZ2UucmVuZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5yb3V0ZXIuYWRkUm91dGUoJy90ZXN0L3tzbHVnfScsIGZ1bmN0aW9uKHNsdWc6IHN0cmluZykge1xuICAgICAgICAgICAgcmV0dXJuIEFwcC5odHRwLmdldEpTT04oYCR7QXBwLmNvbmZpZy5zZXJ2ZXJVcml9L3Rlc3QvJHtzbHVnfS5qc29uYCkudGhlbihmdW5jdGlvbiAocjogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRlc3RDYXNlID0gbmV3IFRlc3RDYXNlKDxUZXN0Q2FzZUVudGl0eT5yLmdldEJvZHkoKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQYWdlKHRlc3RDYXNlKTtcbiAgICAgICAgICAgIH0pLnRoZW4oZnVuY3Rpb24ocGFnZTogUGFnZSkge1xuICAgICAgICAgICAgICAgIHBhZ2UucmVuZGVyKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5yb3V0ZXIucnVuKCkudGhlbihmdW5jdGlvbihhKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnUGFnZSByZW5kZXJlZC4nKTtcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3I6IEVycm9yKSB7XG4gICAgICAgICAgICBQYWdlLnJlbmRlckVycm9yUG9wdXAoZXJyb3IubWVzc2FnZSk7XG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICcvJztcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHJlZ2lzdGVySGFuZGxlYmFyc0hlbHBlcnMoKSB7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2lmX2VxJywgZnVuY3Rpb24oYTogYW55LCBiOiBhbnksIG9wdHM6IGFueSkge1xuICAgICAgICAgICAgaWYgKGEgPT09IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5mbih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMuaW52ZXJzZSh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignaWZfZ3QnLCBmdW5jdGlvbihhOiBhbnksIGI6IGFueSwgb3B0czogYW55KSB7XG4gICAgICAgICAgICBpZiAoYSA+IGIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gb3B0cy5mbih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG9wdHMuaW52ZXJzZSh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigndGltZXN0YW1wJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIGJpbmRFcnJvckxvZ2dpbmcoKSB7XG4gICAgICAgIGlmICghKCdvbmVycm9yJyBpbiB3aW5kb3cpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdGltZVN0YW1wID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuICAgICAgICB3aW5kb3cub25lcnJvciA9IGZ1bmN0aW9uKG1zZywgdXJsLCBsaW5lTm8sIGNvbHVtbk5vLCBlcnJvcikge1xuXG4gICAgICAgICAgICB2YXIgZGlmZiA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgLSB0aW1lU3RhbXA7XG4gICAgICAgICAgICB2YXIgbWludXRlc0RpZmZlcmVuY2UgPSBNYXRoLmZsb29yKGRpZmYgLyAxMDAwIC8gNjApO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnTWludXRlcyBkaWZmZXJlbmNlOiAnLCBtaW51dGVzRGlmZmVyZW5jZSk7XG5cbiAgICAgICAgICAgIHZhciBlcnJvckRUTyA9IHtcbiAgICAgICAgICAgICAgICBtc2c6IG1zZyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCB8fCB3aW5kb3cubG9jYXRpb24uaHJlZixcbiAgICAgICAgICAgICAgICBsaW5lTm86IGxpbmVObyxcbiAgICAgICAgICAgICAgICBjb2xObzogY29sdW1uTm8sXG4gICAgICAgICAgICAgICAgdHJhY2U6IGVycm9yLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIEFwcC5odHRwLnBvc3RKU09OKGAke0FwcC5jb25maWcuc2VydmVyVXJpfS9sb2cuanNvbmAsIGVycm9yRFRPKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHRpbWVTdGFtcCA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9O1xufVxuXG5pbnRlcmZhY2UgQXBwQ29uZmlnSW50ZXJmYWNlIHtcbiAgICBzZXJ2ZXJVcmk6IHN0cmluZztcbiAgICBjbGllbnRVcmk6IHN0cmluZztcbn1cbiIsImltcG9ydCBQcm9taXNlID0gUS5Qcm9taXNlO1xuZXhwb3J0IGNsYXNzIEh0dHAge1xuICAgIHByb3RlY3RlZCBfcmVxdWVzdDogSHR0cFJlcXVlc3RJbnRlcmZhY2U7XG4gICAgcHJvdGVjdGVkIF9yZXNwb25zZTogSHR0cFJlc3BvbnNlSW50ZXJmYWNlO1xuXG4gICAgLy8gSFRUUCBjb2Rlcy5cbiAgICBwdWJsaWMgc3RhdGljIEhUVFBfU1VDQ0VTUzogbnVtYmVyID0gMjAwO1xuICAgIHB1YmxpYyBzdGF0aWMgSFRUUF9DUkVBVEVEOiBudW1iZXIgPSAyMDE7XG4gICAgcHVibGljIHN0YXRpYyBIVFRQX05PVF9GT1VORDogbnVtYmVyID0gNDA0O1xuICAgIHB1YmxpYyBzdGF0aWMgSFRUUF9CQURfUkVRVUVTVDogbnVtYmVyID0gNDAwO1xuXG4gICAgcHVibGljIHN0YXRpYyBYSFJfVU5TRU5UOiBudW1iZXIgPSAwO1xuICAgIHB1YmxpYyBzdGF0aWMgWEhSX09QRU5FRDogbnVtYmVyID0gMTtcbiAgICBwdWJsaWMgc3RhdGljIFhIUl9IRUFERVJTX1JFQ0VJVkVEOiBudW1iZXIgPSAyO1xuICAgIHB1YmxpYyBzdGF0aWMgWEhSX0xPQURJTkc6IG51bWJlciA9IDM7XG4gICAgcHVibGljIHN0YXRpYyBYSFJfRE9ORTogbnVtYmVyID0gNDtcblxuICAgIHByb3RlY3RlZCBzdGF0aWMgZnJvbVN0cmluZ1RvSlNPTihzdHI6IHN0cmluZyk6IE9iamVjdCB7XG4gICAgICAgIHJldHVybiBzdHIgPyBKU09OLnBhcnNlKHN0cikgOiB7fTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc3RhdGljIGZyb21KU09OVG9TdHJpbmcoanNvbk9iajogT2JqZWN0KTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGpzb25PYmopO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBzdGF0aWMgY29udGVudFR5cGVJc0pTT04oaGVhZGVyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCFoZWFkZXIpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIHJldHVybiAhIWhlYWRlci5tYXRjaCgvYXBwbGljYXRpb25cXC9qc29uL2kpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZW5kUmVxdWVzdChyZXF1ZXN0OiBIdHRwUmVxdWVzdEludGVyZmFjZSk6IFByb21pc2U8SHR0cFJlc3BvbnNlSW50ZXJmYWNlPiB7XG4gICAgICAgIHZhciBkZWZlcnJlZCA9IFEuZGVmZXI8SHR0cFJlc3BvbnNlSW50ZXJmYWNlPigpO1xuICAgICAgICB2YXIgeGhyID0gdHlwZW9mIFhNTEh0dHBSZXF1ZXN0ICE9PSAndW5kZWZpbmVkJyA/IG5ldyBYTUxIdHRwUmVxdWVzdCgpIDogbnVsbDtcbiAgICAgICAgeGhyLm9wZW4ocmVxdWVzdC5nZXRNZXRob2QoKSwgcmVxdWVzdC5nZXRVcmwoKSwgdHJ1ZSk7XG5cbiAgICAgICAgKGZ1bmN0aW9uKGhlYWRlcnM6IEh0dHBIZWFkZXJzSW50ZXJmYWNlKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaGVhZGVycy5oYXNPd25Qcm9wZXJ0eShpKSkge1xuICAgICAgICAgICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihpLCBoZWFkZXJzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pKHJlcXVlc3QuZ2V0SGVhZGVycygpKTtcblxuICAgICAgICB2YXIgX3Jlc3BvbnNlID0gdGhpcy5fcmVzcG9uc2U7XG4gICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gSHR0cC5YSFJfRE9ORSkge1xuICAgICAgICAgICAgICAgIF9yZXNwb25zZSA9IG5ldyBSZXNwb25zZSh4aHIuc3RhdHVzLCB4aHIucmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIHJlc3BvbnNlIGJvZHkgdG8gSlNPTi5cbiAgICAgICAgICAgICAgICAvLyBLZWVwIHRoZSByYXcgYm9keSB1bnRvdWNoZWQuXG4gICAgICAgICAgICAgICAgaWYgKEh0dHAuY29udGVudFR5cGVJc0pTT04odGhpcy5nZXRSZXNwb25zZUhlYWRlcignY29udGVudC10eXBlJykpKSB7XG4gICAgICAgICAgICAgICAgICAgIF9yZXNwb25zZS5zZXRCb2R5KEh0dHAuZnJvbVN0cmluZ1RvSlNPTihfcmVzcG9uc2UuZ2V0Qm9keVJhdygpKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh4aHIuc3RhdHVzID09PSBIdHRwLkhUVFBfU1VDQ0VTUyB8fCB4aHIuc3RhdHVzID09PSBIdHRwLkhUVFBfQ1JFQVRFRCkge1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKF9yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KF9yZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChyZXF1ZXN0LmdldEJvZHkoKSkge1xuICAgICAgICAgICAgeGhyLnNlbmQocmVxdWVzdC5nZXRCb2R5KCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgeGhyLnNlbmQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZC5wcm9taXNlO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgcmVxdWVzdCgpOiBIdHRwUmVxdWVzdEludGVyZmFjZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0O1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXQgcmVxdWVzdChyZXF1ZXN0OiBIdHRwUmVxdWVzdEludGVyZmFjZSkge1xuICAgICAgICB0aGlzLl9yZXF1ZXN0ID0gcmVxdWVzdDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHJlc3BvbnNlKCk6IEh0dHBSZXNwb25zZUludGVyZmFjZSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9yZXNwb25zZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHJlc3BvbnNlKHJlc3BvbnNlOiBIdHRwUmVzcG9uc2VJbnRlcmZhY2UpIHtcbiAgICAgICAgdGhpcy5fcmVzcG9uc2UgPSByZXNwb25zZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2VuZChtZXRob2Q6IHN0cmluZywgdXJsOiBzdHJpbmcsIGJvZHk6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5zZW5kUmVxdWVzdChcbiAgICAgICAgICAgIG5ldyBSZXF1ZXN0KG1ldGhvZCwgdXJsLCBudWxsLCBib2R5KVxuICAgICAgICApO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRKU09OKHVybDogc3RyaW5nKTogUHJvbWlzZTxIdHRwUmVzcG9uc2VJbnRlcmZhY2U+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VuZFJlcXVlc3QoXG4gICAgICAgICAgICBuZXcgUmVxdWVzdCgnR0VUJywgdXJsLCB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ30sIG51bGwpXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZTogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgcG9zdEpTT04odXJsOiBzdHJpbmcsIGJvZHk6IE9iamVjdCk6IFByb21pc2U8SHR0cFJlc3BvbnNlSW50ZXJmYWNlPiB7XG4gICAgICAgIHZhciBib2R5U3RyaW5nID0gSHR0cC5mcm9tSlNPTlRvU3RyaW5nKGJvZHkpO1xuICAgICAgICByZXR1cm4gdGhpcy5zZW5kUmVxdWVzdChcbiAgICAgICAgICAgIG5ldyBSZXF1ZXN0KCdQT1NUJywgdXJsLCB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJywgJ0FjY2VwdCc6ICdhcHBsaWNhdGlvbi9qc29uJ30sIGJvZHlTdHJpbmcpXG4gICAgICAgICkudGhlbihmdW5jdGlvbihyZXNwb25zZTogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0SFRNTCh1cmw6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gdGhpcy5zZW5kUmVxdWVzdChcbiAgICAgICAgICAgIG5ldyBSZXF1ZXN0KCdHRVQnLCB1cmwsIHsnQ29udGVudC1UeXBlJzogJ3RleHQvaHRtbCcsICdBY2NlcHQnOiAndGV4dC9odG1sJ30sIG51bGwpXG4gICAgICAgICk7XG4gICAgfTtcbn1cblxuY2xhc3MgUmVxdWVzdCBpbXBsZW1lbnRzIEh0dHBSZXF1ZXN0SW50ZXJmYWNlIHtcbiAgICBwcm90ZWN0ZWQgbWV0aG9kOiBzdHJpbmc7XG4gICAgcHJvdGVjdGVkIHVybDogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBoZWFkZXJzOiBIdHRwSGVhZGVyc0ludGVyZmFjZTtcbiAgICBwcm90ZWN0ZWQgYm9keTogc3RyaW5nO1xuXG4gICAgY29uc3RydWN0b3IobWV0aG9kOiBzdHJpbmcsIHVybDogc3RyaW5nLCBoZWFkZXJzOiBIdHRwSGVhZGVyc0ludGVyZmFjZSwgYm9keTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMubWV0aG9kID0gbWV0aG9kO1xuICAgICAgICB0aGlzLnVybCA9IHVybDtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gaGVhZGVycyB8fCB7fTtcbiAgICAgICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgICB9O1xuXG4gICAgcHVibGljIGdldE1ldGhvZCgpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5tZXRob2Q7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRVcmwoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudXJsO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0SGVhZGVycygpOiBIdHRwSGVhZGVyc0ludGVyZmFjZSB7XG4gICAgICAgIHJldHVybiB0aGlzLmhlYWRlcnM7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRCb2R5KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmJvZHk7XG4gICAgfTtcbn1cblxuaW50ZXJmYWNlIEh0dHBSZXF1ZXN0SW50ZXJmYWNlIHtcbiAgICBnZXRNZXRob2QoKTogc3RyaW5nO1xuICAgIGdldFVybCgpOiBzdHJpbmc7XG4gICAgZ2V0SGVhZGVycygpOiBIdHRwSGVhZGVyc0ludGVyZmFjZTtcbiAgICBnZXRCb2R5KCk6IHN0cmluZyB8IE9iamVjdDtcbn1cblxuY2xhc3MgUmVzcG9uc2UgaW1wbGVtZW50cyBIdHRwUmVzcG9uc2VJbnRlcmZhY2Uge1xuICAgIHByb3RlY3RlZCBzdGF0dXM6IG51bWJlcjtcbiAgICBwcm90ZWN0ZWQgYm9keTogc3RyaW5nIHwgT2JqZWN0O1xuICAgIHByb3RlY3RlZCBib2R5UmF3OiBzdHJpbmc7XG5cbiAgICBjb25zdHJ1Y3RvcihzdGF0dXM6IG51bWJlciwgYm9keTogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuICAgICAgICB0aGlzLmJvZHkgPSBib2R5O1xuICAgICAgICB0aGlzLmJvZHlSYXcgPSBib2R5O1xuICAgIH07XG5cbiAgICBwdWJsaWMgc2V0U3RhdHVzKHN0YXR1czogbnVtYmVyKSB7XG4gICAgICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuICAgIH07XG5cbiAgICBwdWJsaWMgZ2V0U3RhdHVzKCk6IG51bWJlciB7XG4gICAgICAgIHJldHVybiB0aGlzLnN0YXR1cztcbiAgICB9O1xuXG4gICAgcHVibGljIHNldEJvZHkoYm9keTogc3RyaW5nIHwgT2JqZWN0KSB7XG4gICAgICAgIHRoaXMuYm9keSA9IGJvZHk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRCb2R5KCk6IHN0cmluZyB8IE9iamVjdCB7XG4gICAgICAgIHJldHVybiB0aGlzLmJvZHk7XG4gICAgfTtcblxuICAgIHB1YmxpYyBnZXRCb2R5UmF3KCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmJvZHlSYXc7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIEh0dHBSZXNwb25zZUludGVyZmFjZSB7XG4gICAgZ2V0U3RhdHVzKCk6IG51bWJlcjtcbiAgICBzZXRTdGF0dXMoc3RhdHVzOiBudW1iZXIpOiB2b2lkO1xuICAgIGdldEJvZHkoKTogc3RyaW5nIHwgT2JqZWN0O1xuICAgIHNldEJvZHkoYm9keTogc3RyaW5nIHwgT2JqZWN0KTogdm9pZDtcbiAgICBnZXRCb2R5UmF3KCk6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEh0dHBIZWFkZXJzSW50ZXJmYWNlIHtcbiAgICBba2V5OiBzdHJpbmddOiBzdHJpbmc7XG59XG4iLCJpbXBvcnQge1Rlc3RDYXNlLCBUZXN0Q2FzZUVudn0gZnJvbSAnLi9UZXN0Q2FzZSc7XG5pbXBvcnQge0FwcH0gZnJvbSAnLi9BcHAnO1xuaW1wb3J0IHtIdHRwUmVzcG9uc2VJbnRlcmZhY2V9IGZyb20gJy4vSHR0cCc7XG5pbXBvcnQge1J1bm5lciwgUnVubmVyUmVzdWx0fSBmcm9tICcuL1J1bm5lcic7XG5pbXBvcnQge1RvdGFsQnlCcm93c2VyLCBUb3RhbENoYXJ0UGFuZWx9IGZyb20gJy4vVG90YWxDaGFydFBhbmVsJztcbmltcG9ydCBQcm9taXNlID0gUS5Qcm9taXNlO1xuXG5leHBvcnQgY2xhc3MgUGFnZSB7XG4gICAgcHJvdGVjdGVkIHRlc3RDYXNlOiBUZXN0Q2FzZTtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcih0ZXN0Q2FzZTogVGVzdENhc2UpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1Rlc3RDYXNlIGNvbnN0cnVjdG9yIC4uLicpO1xuICAgICAgICB0aGlzLnRlc3RDYXNlID0gdGVzdENhc2U7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyByZW5kZXJFbGVtKGlkOiBzdHJpbmcsIGh0bWw6IHN0cmluZywgZGF0YTogT2JqZWN0KSB7XG4gICAgICAgIHZhciAkZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy5jb21waWxlKGh0bWwpO1xuICAgICAgICAkZWxlbS5pbm5lckhUTUwgPSB0ZW1wbGF0ZShkYXRhKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgICAvLyBSZW5kZXIgJ1NpZGViYXInLlxuICAgICAgICAvLyBBcHAuaHR0cC5nZXRIVE1MKEFwcC5jb25maWcuY2xpZW50VXJpICsgJy90cGwvdGVzdGNhc2Utc2lkZWJhci1mb3JtLmhicycpXG4gICAgICAgICAgICAvLyAudGhlbigocjogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gUGFnZS5yZW5kZXJFbGVtKCd0ZXN0Y2FzZS1zaWRlYmFyLWZvcm0nLCA8c3RyaW5nPnIuZ2V0Qm9keSgpLCB0aGlzLnRlc3RDYXNlKTtcbiAgICAgICAgICAgIC8vIH0pXG4gICAgICAgICAgICAvLyAudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcy5iaW5kU2F2ZUJ0bigpO1xuICAgICAgICAgICAgICAgIC8vIHRoaXMuYmluZFJ1bkJ0bigpO1xuICAgICAgICAgICAgLy8gfSk7XG5cbiAgICAgICAgLy8gUmVuZGVyICdMaXN0aW5ncycuXG4gICAgICAgIFEuc3ByZWFkKFtcbiAgICAgICAgICAgIEFwcC5odHRwLmdldEpTT04oQXBwLmNvbmZpZy5zZXJ2ZXJVcmkgKyAnL3Rlc3RzLmpzb24/ZXhjbHVkZT1yZXZpc2lvbl9udW1iZXIsZGVzY3JpcHRpb24saGFybmVzcyxlbnRyaWVzLHN0YXR1cyZvcmRlckJ5PWxhdGVzdCZsaW1pdD0yNScpLFxuICAgICAgICAgICAgQXBwLmh0dHAuZ2V0SFRNTChBcHAuY29uZmlnLmNsaWVudFVyaSArICcvdHBsL3Rlc3RjYXNlLXNpZGViYXItbGlzdGluZy5oYnMnKVxuICAgICAgICBdLCAoZGF0YVI6IEh0dHBSZXNwb25zZUludGVyZmFjZSwgdHBsUjogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSA9PiB7XG4gICAgICAgICAgICBQYWdlLnJlbmRlckVsZW0oJ3NpZGViYXItbGlzdGluZycsIDxzdHJpbmc+dHBsUi5nZXRCb2R5KCksIDxPYmplY3Q+ZGF0YVIuZ2V0Qm9keSgpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gUmVuZGVyICdNYWluIGZvcm0nLlxuICAgICAgICBRLnNwcmVhZChbXG4gICAgICAgICAgICBBcHAuaHR0cC5nZXRIVE1MKEFwcC5jb25maWcuY2xpZW50VXJpICsgJy90cGwvdGVzdGNhc2UtZW50cnktZm9ybS5oYnMnKSxcbiAgICAgICAgICAgIEFwcC5odHRwLmdldEhUTUwoQXBwLmNvbmZpZy5jbGllbnRVcmkgKyAnL3RwbC90ZXN0Y2FzZS1tYWluLWZvcm0uaGJzJylcbiAgICAgICAgXSwgKHRwbEVudHJ5UjogSHR0cFJlc3BvbnNlSW50ZXJmYWNlLCB0cGxNYWluUjogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSA9PiB7XG4gICAgICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCgnZW50cnknLCB0cGxFbnRyeVIuZ2V0Qm9keSgpKTtcbiAgICAgICAgICAgIFBhZ2UucmVuZGVyRWxlbSgndGVzdGNhc2UtbWFpbi1mb3JtJywgPHN0cmluZz50cGxNYWluUi5nZXRCb2R5KCksIHRoaXMudGVzdENhc2UpO1xuICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYmluZFNhdmVCdG4oKTtcbiAgICAgICAgICAgIHRoaXMuYmluZEFkZFRlc3RFbnRyeUJ0bigpO1xuICAgICAgICAgICAgdGhpcy5iaW5kUnVuQnRuKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgcmVuZGVyRXJyb3JQb3B1cChlcnJvcjogRXJyb3JSZXNwb25zZURUTyB8IHN0cmluZykge1xuICAgICAgICB2YXIgbXNnVHh0OiBzdHJpbmcgPSAnU29tZSBraW5kIG9mIGVycm9yIG9jY3VycmVkLic7XG4gICAgICAgIGlmICh0eXBlb2YgZXJyb3IgPT09ICdvYmplY3QnICYmIHR5cGVvZiBlcnJvci5lcnJvciAhPT0gJ3VuZGVmaW5lZCcgJiYgZXJyb3IuZXJyb3IubWVzc2FnZSkge1xuICAgICAgICAgICAgbXNnVHh0ID0gZXJyb3IuZXJyb3IubWVzc2FnZTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgZXJyb3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBtc2dUeHQgPSBlcnJvcjtcbiAgICAgICAgfVxuICAgICAgICB3aW5kb3cuYWxlcnQobXNnVHh0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyQ2hhcnRQYW5lbCgpIHtcbiAgICAgICAgdmFyIHBhbmVsID0gbmV3IFRvdGFsQ2hhcnRQYW5lbCh0aGlzLCB0aGlzLnRlc3RDYXNlKTtcbiAgICAgICAgcGFuZWwuZ2V0RGF0YSgpLnRoZW4oKHI6IEh0dHBSZXNwb25zZUludGVyZmFjZSkgPT4ge1xuICAgICAgICAgICAgcGFuZWwucmVuZGVyKDxUb3RhbEJ5QnJvd3NlcltdPnIuZ2V0Qm9keSgpKTtcbiAgICAgICAgfSwgZnVuY3Rpb24ocmVzcG9uc2U6IEh0dHBSZXNwb25zZUludGVyZmFjZSkge1xuICAgICAgICAgICAgUGFnZS5yZW5kZXJFcnJvclBvcHVwKDxFcnJvclJlc3BvbnNlRFRPPnJlc3BvbnNlLmdldEJvZHkoKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBwcm90ZWN0ZWQgYmluZFNhdmVCdG4oKSB7XG4gICAgICAgIHZhciAkc2F2ZUJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzYXZlLXRlc3RjYXNlLWJ1dHRvbicpO1xuXG4gICAgICAgICRzYXZlQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgUGFnZS50b2dnbGVSZW5kZXJCdG4oJ3NhdmUtdGVzdGNhc2UtYnV0dG9uJywgJ2Rpc2FibGUnKTtcblxuICAgICAgICAgICAgdmFyIHRlc3RDYXNlRFRPID0gVGVzdENhc2UuY3JlYXRlRW50aXR5RnJvbURPTUVsZW1lbnQoJ3Rlc3RjYXNlLW1haW4tZm9ybScpO1xuICAgICAgICAgICAgLy8gQXBwZW5kIHRoZSBicm93c2VyIGRhdGEuXG4gICAgICAgICAgICB0ZXN0Q2FzZURUTy5lbnYgPSA8VGVzdENhc2VFbnY+e1xuICAgICAgICAgICAgICAgIGJyb3dzZXJOYW1lOiBwbGF0Zm9ybS5uYW1lLFxuICAgICAgICAgICAgICAgIGJyb3dzZXJWZXJzaW9uOiBwbGF0Zm9ybS52ZXJzaW9uLFxuICAgICAgICAgICAgICAgIG9zOiBwbGF0Zm9ybS5vc1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgQXBwLmh0dHAucG9zdEpTT04oQXBwLmNvbmZpZy5zZXJ2ZXJVcmkgKyAnL3Rlc3RzLmpzb24nLCB0ZXN0Q2FzZURUTylcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgUGFnZS50b2dnbGVSZW5kZXJCdG4oJ3NhdmUtdGVzdGNhc2UtYnV0dG9uJywgJ2FjdGl2YXRlJyk7XG4gICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24ocmVzcG9uc2U6IEh0dHBSZXNwb25zZUludGVyZmFjZSkge1xuICAgICAgICAgICAgICAgICAgICBQYWdlLnRvZ2dsZVJlbmRlckJ0bignc2F2ZS10ZXN0Y2FzZS1idXR0b24nLCAnYWN0aXZhdGUnKTtcbiAgICAgICAgICAgICAgICAgICAgUGFnZS5yZW5kZXJFcnJvclBvcHVwKDxFcnJvclJlc3BvbnNlRFRPPnJlc3BvbnNlLmdldEJvZHkoKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByb3RlY3RlZCBiaW5kUnVuQnRuKCkge1xuICAgICAgICB2YXIgX3BhZ2UgPSB0aGlzO1xuICAgICAgICB2YXIgJHJ1bkJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdydW4tdGVzdGNhc2UtYnV0dG9uJyk7XG5cbiAgICAgICAgLy8gJ1J1biB0ZXN0cycgYnV0dG9uLlxuICAgICAgICAkcnVuQnRuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGUpID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgICAgUGFnZS50b2dnbGVSZW5kZXJCdG4oJ3J1bi10ZXN0Y2FzZS1idXR0b24nLCAnZGlzYWJsZScpO1xuXG4gICAgICAgICAgICB2YXIgdGVzdENhc2VEVE8gPSBUZXN0Q2FzZS5jcmVhdGVFbnRpdHlGcm9tRE9NRWxlbWVudCgndGVzdGNhc2UtbWFpbi1mb3JtJyk7XG5cbiAgICAgICAgICAgIC8vIEFwcGVuZCB0aGUgYnJvd3NlciBkYXRhLlxuICAgICAgICAgICAgdGVzdENhc2VEVE8uZW52ID0gPFRlc3RDYXNlRW52PntcbiAgICAgICAgICAgICAgICBicm93c2VyTmFtZTogcGxhdGZvcm0ubmFtZSxcbiAgICAgICAgICAgICAgICBicm93c2VyVmVyc2lvbjogcGxhdGZvcm0udmVyc2lvbixcbiAgICAgICAgICAgICAgICBvczogcGxhdGZvcm0ub3NcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIFJlbmRlciAnUmVzdWx0cycgcGFuZWwgd2l0aCBwcmVsaW1pbmFyeSBkYXRhLlxuICAgICAgICAgICAgQXBwLmh0dHAuZ2V0SFRNTChgJHtBcHAuY29uZmlnLmNsaWVudFVyaX0vdHBsL3Rlc3RjYXNlLXJlc3VsdHMtdGFibGUuaGJzYClcbiAgICAgICAgICAgICAgICAudGhlbigocjogSHR0cFJlc3BvbnNlSW50ZXJmYWNlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIFBhZ2UucmVuZGVyRWxlbSgncmVzdWx0cycsIDxzdHJpbmc+ci5nZXRCb2R5KCksIHRlc3RDYXNlRFRPKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBDcmVhdGUgdGhlIEpTIGNvZGUgYW5kIHJ1biBpdCBpbiBicm93c2VyLlxuICAgICAgICAgICAgICAgICAgICB2YXIgcnVubmVyID0gbmV3IFJ1bm5lcihcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBUZXN0Q2FzZSh0ZXN0Q2FzZURUTylcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgcnVubmVyLnJ1bigpLnRoZW4oKHJlc3VsdHM6IFJ1bm5lclJlc3VsdFtdKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZS1hY3RpdmF0ZSAnUnVuJyBidG4uXG4gICAgICAgICAgICAgICAgICAgICAgICBQYWdlLnRvZ2dsZVJlbmRlckJ0bigncnVuLXRlc3RjYXNlLWJ1dHRvbicsICdhY3RpdmF0ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2VuZCB0aGUgdGVzdCByZXN1bHRzLlxuICAgICAgICAgICAgICAgICAgICAgICAgX3BhZ2Uuc2VuZFJlc3VsdHMocmVzdWx0cykudGhlbihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlbmRlciAnQ2hhcnQgUGFuZWwnLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZW5kZXJpbmcgQ2hhcnQgUGFuZWwgLi4uJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3BhZ2UucmVuZGVyQ2hhcnRQYW5lbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFBhZ2UucmVuZGVyRXJyb3JQb3B1cChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sIGZhbHNlKTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgYmluZEFkZFRlc3RFbnRyeUJ0bigpIHtcbiAgICAgICAgLy8gJ0FkZCBuZXcgdGVzdCcgYnV0dG9uLlxuICAgICAgICB2YXIgJGJ0biA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhZGQtdGVzdC1saW5rJyk7XG5cbiAgICAgICAgJGJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7IGNvbnNvbGUubG9nKCdjbGljaz8nKTtcblxuICAgICAgICAgICAgQXBwLmh0dHAuZ2V0SFRNTChgJHtBcHAuY29uZmlnLmNsaWVudFVyaX0vdHBsL3Rlc3RjYXNlLWVudHJ5LWZvcm0uaGJzYCkudGhlbigocmVzcG9uc2U6IEh0dHBSZXNwb25zZUludGVyZmFjZSkgPT4ge1xuICAgICAgICAgICAgICAgIC8vIEFkZCB0byBtb2RlbC5cbiAgICAgICAgICAgICAgICAvLyBAdG9kbyBUaGlzIHNob3VsZCBiZSB0aGUgTVZDcyBqb2IuXG4gICAgICAgICAgICAgICAgdmFyIGVudHJ5SWQgPSBQYWdlLmdldE5leHRUZXN0Q2FzZUVudHJ5SWQoKTtcbiAgICAgICAgICAgICAgICB2YXIgbmV3VGVzdEVudHJ5ID0gVGVzdENhc2UuY3JlYXRlRW1wdHlUZXN0Q2FzZUVudHJ5KGVudHJ5SWQpO1xuICAgICAgICAgICAgICAgIHRoaXMudGVzdENhc2UuYWRkRW50cnkobmV3VGVzdEVudHJ5KTtcblxuICAgICAgICAgICAgICAgIC8vIFJlbmRlciBuZXcgdGVzdCBlbnRyeS5cbiAgICAgICAgICAgICAgICB2YXIgdGVtcGxhdGUgPSBIYW5kbGViYXJzLmNvbXBpbGUocmVzcG9uc2UuZ2V0Qm9keSgpKTtcbiAgICAgICAgICAgICAgICB2YXIgaHRtbCA9IHRlbXBsYXRlKG5ld1Rlc3RFbnRyeSk7XG4gICAgICAgICAgICAgICAgdmFyICRuZXdFbnRyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgICAgICAgICAgICRuZXdFbnRyeS5pbm5lckhUTUwgPSBodG1sO1xuICAgICAgICAgICAgICAgIHZhciAkZW50cmllcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbnRyaWVzJyk7XG4gICAgICAgICAgICAgICAgJGVudHJpZXMuYXBwZW5kQ2hpbGQoJG5ld0VudHJ5LmZpcnN0Q2hpbGQpO1xuICAgICAgICAgICAgICAgIC8vIEJpbmQgZXZlbnRzIHRvIGl0LlxuICAgICAgICAgICAgICAgIHRoaXMuYmluZFJlbW92ZVRlc3RFbnRyeUJ0bihlbnRyeUlkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIGJpbmRSZW1vdmVUZXN0RW50cnlCdG4oZW50cnlJZDogbnVtYmVyKSB7XG4gICAgICAgIHZhciAkZW50cmllcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlbnRyaWVzJyk7XG4gICAgICAgIHZhciAkZW50cnkgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGVzdGNhc2UtdGVzdC0nICsgZW50cnlJZCk7XG4gICAgICAgIHZhciAkYnV0dG9uID0gJGVudHJ5LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3Rlc3RjYXNlLXRlc3QtcmVtb3ZlJyk7XG5cbiAgICAgICAgJGJ1dHRvblswXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChlKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnY2xpY2s/Jyk7XG5cbiAgICAgICAgICAgIC8vIFJlbW92ZSBmcm9tIG1vZGVsLlxuICAgICAgICAgICAgLy8gQHRvZG8gVGhpcyBzaG91bGQgYmUgdGhlIE1WQ3Mgam9iLlxuICAgICAgICAgICAgdGhpcy50ZXN0Q2FzZS5yZW1vdmVFbnRyeShlbnRyeUlkKTtcblxuICAgICAgICAgICAgLy8gUmVtb3ZlIGZyb20gRE9NLlxuICAgICAgICAgICAgJGVudHJpZXMucmVtb3ZlQ2hpbGQoJGVudHJ5KTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHByb3RlY3RlZCBzdGF0aWMgZ2V0TmV4dFRlc3RDYXNlRW50cnlJZCgpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ3Rlc3RjYXNlLXRlc3QnKS5sZW5ndGggKyAxO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgdG9nZ2xlUmVuZGVyQnRuKGlkOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nKSB7XG4gICAgICAgIHZhciAkYnRuID0gPEhUTUxCdXR0b25FbGVtZW50PmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblxuICAgICAgICBpZiAoc3RhdHVzID09PSAnYWN0aXZhdGUnKSB7XG4gICAgICAgICAgICAkYnRuLmNsYXNzTGlzdC5yZW1vdmUoJ2J0bi1sb2FkaW5nJyk7XG4gICAgICAgICAgICAkYnRuLmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkYnRuLmNsYXNzTmFtZSArPSAnIGJ0bi1sb2FkaW5nJztcbiAgICAgICAgICAgICRidG4uZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHNlbmRSZXN1bHRzKHJlc3VsdHM6IFJ1bm5lclJlc3VsdFtdKTogUHJvbWlzZTxIdHRwUmVzcG9uc2VJbnRlcmZhY2U+IHtcblxuICAgICAgICAvLyBSZWZyZXNoIHRoZSB0ZXN0Q2FzZSBvYmplY3QuXG4gICAgICAgIC8vIEB0b2RvIE1vZGVsIGlzIG5vdCBrZWVwaW5nIHVwIHdpdGggRE9NIGNoYW5nZXMuIFJlZmFjdG9yLlxuICAgICAgICB2YXIgdGVzdENhc2VEVE8gPSBUZXN0Q2FzZS5jcmVhdGVFbnRpdHlGcm9tRE9NRWxlbWVudCgndGVzdGNhc2UtbWFpbi1mb3JtJyk7XG5cbiAgICAgICAgLy8gQXBwZW5kIHRoZSByZXN1bHRzLlxuICAgICAgICAvLyBLZWVwIHRoZSBvcmlnaW5hbCBmb3JtIG9yZGVyLlxuICAgICAgICAvLyBUaGF0J3Mgd2h5IHJlc3VsdHMgaXMgYW4gb2JqZWN0IHN0YXJ0aW5nIGZyb20ga2V5IDEuXG4gICAgICAgIGZvciAodmFyIGkgaW4gcmVzdWx0cykge1xuICAgICAgICAgICAgaWYgKCFyZXN1bHRzLmhhc093blByb3BlcnR5KGkpKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0ZXN0Q2FzZURUTy5lbnRyaWVzW2ldLnJlc3VsdHMgPSByZXN1bHRzW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXBwZW5kIHRoZSBicm93c2VyIGRhdGEuXG4gICAgICAgIHRlc3RDYXNlRFRPLmVudiA9IDxUZXN0Q2FzZUVudj57XG4gICAgICAgICAgICBicm93c2VyTmFtZTogcGxhdGZvcm0ubmFtZSxcbiAgICAgICAgICAgIGJyb3dzZXJWZXJzaW9uOiBwbGF0Zm9ybS52ZXJzaW9uLFxuICAgICAgICAgICAgb3M6IHBsYXRmb3JtLm9zXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc29sZS5sb2codGVzdENhc2VEVE8sIEpTT04uc3RyaW5naWZ5KHRlc3RDYXNlRFRPKSk7XG5cbiAgICAgICAgLy8gVXBkYXRlIHRoZSBtb2RlbC5cbiAgICAgICAgdGhpcy50ZXN0Q2FzZSA9IFRlc3RDYXNlLmNyZWF0ZSh0ZXN0Q2FzZURUTyk7XG5cbiAgICAgICAgcmV0dXJuIEFwcC5odHRwLnBvc3RKU09OKGAke0FwcC5jb25maWcuc2VydmVyVXJpfS90ZXN0cy5qc29uYCwgdGVzdENhc2VEVE8pO1xuICAgIH07XG5cbn1cblxuaW50ZXJmYWNlIEJ1dHRvbkV2ZW50VGFyZ2V0IGV4dGVuZHMgRXZlbnRUYXJnZXQge1xuICAgIGRhdGFzZXQ6IHtcbiAgICAgICAgZW50cnlJZDogbnVtYmVyO1xuICAgIH07XG59XG5cbmludGVyZmFjZSBFcnJvclJlc3BvbnNlRFRPIHtcbiAgICBlcnJvcjoge1xuICAgICAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgICAgIGRhdGE6IEFycmF5PHtcbiAgICAgICAgICAgIHJlYXNvbjogc3RyaW5nLFxuICAgICAgICAgICAgY29kZTogc3RyaW5nXG4gICAgICAgIH0+LFxuICAgICAgICBjb2RlOiBzdHJpbmdcbiAgICB9O1xufVxuIiwiaW1wb3J0IGRlZmVyID0gUS5kZWZlcjtcbmV4cG9ydCBjbGFzcyBSb3V0ZXIge1xuICAgIHByb3RlY3RlZCByb3V0ZXM6IFJvdXRlW10gPSBbXTtcblxuICAgIHB1YmxpYyBydW4oY3VzdG9tUGF0aD86IHN0cmluZykge1xuICAgICAgICB2YXIgZGVmZXJyZWQgPSBRLmRlZmVyKCk7XG5cbiAgICAgICAgdmFyIHBhdGg6IHN0cmluZyA9IGN1c3RvbVBhdGggPyBjdXN0b21QYXRoIDogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICB2YXIgcm91dGUgPSB0aGlzLm1hdGNoUm91dGUocGF0aCk7XG4gICAgICAgIGlmIChyb3V0ZSkge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVzb2x2ZShyb3V0ZS5hY3Rpb24uYXBwbHkobnVsbCwgcm91dGUuYXJncykpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KG5ldyBFcnJvcignTm8gdmFsaWQgcm91dGUgZm91bmQuJykpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlZmVycmVkLnByb21pc2U7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFJvdXRlKHBhdGg6IHN0cmluZywgYWN0aW9uOiBGdW5jdGlvbikge1xuICAgICAgICBpZiAoIXBhdGggfHwgIWFjdGlvbikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5yb3V0ZXMucHVzaCh7XG4gICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgYWN0aW9uOiBhY3Rpb25cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogMS4gR0VUIC90ZXN0L3NkYWRhYWQxMi90b3RhbHMvYnlTdHVmZi5qc29uXG4gICAgICogMi4gVHJ5IG1hdGNoIHdpdGggL3Rlc3Qve3Rlc3R9L3RvdGFscy97ZmlsdGVyfS5qc29uXG4gICAgICogMy5cbiAgICAgKiB2YXIgYWEgPSBcIi90ZXN0L3NkYWRhYWQxMi90b3RhbHMvYnlTdHVmZi5qc29uXCIubWF0Y2gobmV3IFJlZ0V4cChcIlxcL3Rlc3RcXC8oW2EtejAtOV0rKVxcL3RvdGFsc1xcLyhbYS16MC05XSspXFwuanNvblwiLCAnaScpKTsgYWEgPSBhYS5zbGljZSgxLCBhYS5sZW5ndGgpO1xuICAgICovXG4gICAgcHJvdGVjdGVkIG1hdGNoUm91dGUocGF0aDogc3RyaW5nKTogUmVxdWVzdGVkUm91dGUge1xuICAgICAgICB2YXIgbWF0Y2hGb3VuZDogQXJyYXk8c3RyaW5nPjtcbiAgICAgICAgdmFyIHByZXBhcmVkUGF0aDogc3RyaW5nO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucm91dGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBwcmVwYXJlZFBhdGggPSBgXiR7Um91dGVyLnByZXBhcmVQYXRoKHRoaXMucm91dGVzW2ldLnBhdGgpfSRgO1xuICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IHBhdGgubWF0Y2gobmV3IFJlZ0V4cChwcmVwYXJlZFBhdGgsICdpJykpO1xuICAgICAgICAgICAgaWYgKG1hdGNoRm91bmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgYXJncyA9IG1hdGNoRm91bmQuc2xpY2UoMSwgbWF0Y2hGb3VuZC5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIHJldHVybiA8UmVxdWVzdGVkUm91dGU+e1xuICAgICAgICAgICAgICAgICAgICBwYXRoOiB0aGlzLnJvdXRlc1tpXS5wYXRoLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb246IHRoaXMucm91dGVzW2ldLmFjdGlvbixcbiAgICAgICAgICAgICAgICAgICAgYXJnczogYXJncyxcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdGVkUGF0aDogcGF0aFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc3RhdGljIHByZXBhcmVQYXRoKHBhdGg6IHN0cmluZykge1xuICAgICAgICByZXR1cm4gcGF0aC5yZXBsYWNlKC97W2Etel0rfS9nLCAnKFthLXowLTktXSspJyk7XG4gICAgfVxufVxuXG5pbnRlcmZhY2UgUm91dGUge1xuICAgIHBhdGg6IHN0cmluZztcbiAgICBhY3Rpb246IEZ1bmN0aW9uO1xufVxuXG5pbnRlcmZhY2UgUmVxdWVzdGVkUm91dGUgZXh0ZW5kcyBSb3V0ZSB7XG4gICAgcmVxdWVzdGVkUGF0aDogc3RyaW5nO1xuICAgIGFyZ3M6IEFycmF5PHN0cmluZz47XG59XG4iLCJpbXBvcnQge1Rlc3RDYXNlfSBmcm9tICcuL1Rlc3RDYXNlJztcbmltcG9ydCBQcm9taXNlID0gUS5Qcm9taXNlO1xuXG5leHBvcnQgY2xhc3MgUnVubmVyIHtcbiAgICBwcm90ZWN0ZWQgdGVzdENhc2U6IFRlc3RDYXNlO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHRlc3RDYXNlOiBUZXN0Q2FzZSkge1xuICAgICAgICB0aGlzLnRlc3RDYXNlID0gdGVzdENhc2U7XG4gICAgfVxuXG4gICAgcHVibGljIHJ1bigpOiBQcm9taXNlPHtba2V5OiBudW1iZXJdOiBSdW5uZXJSZXN1bHR9PiB7XG4gICAgICAgIGlmICghdGhpcy50ZXN0Q2FzZS5pc1JlYWR5VG9SdW4oKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdZb3UgbmVlZCB0byBoYXZlIGF0IGxlYXN0IHR3byBjb2RlIGVudHJpZXMgaW4gb3JkZXIgdG8gcnVuIHRoZSB0ZXN0IGNhc2UuJyk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmxvZygnU3RhcnRpbmcgcnVubmVyIC4uLicpO1xuICAgICAgICByZXR1cm4gdGhpcy5zdGFydEJlbmNoKCk7XG4gICAgfVxuXG4gICAgcHJvdGVjdGVkIHN0YXJ0QmVuY2goKTogUHJvbWlzZTx7W2tleTogbnVtYmVyXTogUnVubmVyUmVzdWx0fT4ge1xuICAgICAgICB2YXIgZGVmZXJyZWRRID0gUS5kZWZlcjx7W2tleTogbnVtYmVyXTogUnVubmVyUmVzdWx0fT4oKTtcblxuICAgICAgICB2YXIgdGVzdENhc2UgPSB0aGlzLnRlc3RDYXNlO1xuICAgICAgICB2YXIgYmVuY2hlczogQmVuY2htYXJrW10gPSBbXTtcbiAgICAgICAgdmFyIGJlbmNoOiBCZW5jaG1hcms7XG4gICAgICAgIHZhciByZXN1bHRzOiB7W2tleTogbnVtYmVyXTogUnVubmVyUmVzdWx0fSA9IHt9O1xuXG4gICAgICAgIGZvciAodmFyIGogaW4gdGVzdENhc2UuZW50cmllcykge1xuICAgICAgICAgICAgaWYgKCF0ZXN0Q2FzZS5lbnRyaWVzLmhhc093blByb3BlcnR5KGopKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGJlbmNoID0gbmV3IEJlbmNobWFyayh0ZXN0Q2FzZS5lbnRyaWVzW2pdLnRpdGxlLCB7XG4gICAgICAgICAgICAgICAgaWQ6IGosXG4gICAgICAgICAgICAgICAgYXN5bmM6IHRydWUsXG4gICAgICAgICAgICAgICAgc2V0dXA6IHRlc3RDYXNlLmhhcm5lc3Muc2V0VXAsXG4gICAgICAgICAgICAgICAgdGVhcmRvd246IHRlc3RDYXNlLmhhcm5lc3MudGVhckRvd24sXG4gICAgICAgICAgICAgICAgZm46IHRlc3RDYXNlLmVudHJpZXNbal0uY29kZSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiBmdW5jdGlvbihlOiBCZW5jaG1hcmsuRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJlbmNoUmVzdWx0OiBCZW5jaG1hcmsgPSA8QmVuY2htYXJrPmUudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICBSdW5uZXIucmVuZGVyUmVzdWx0KGJlbmNoUmVzdWx0LmlkLCAnU3RhcnRpbmcgLi4uJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiBmdW5jdGlvbihlOiBCZW5jaG1hcmsuRXZlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJlbmNoUmVzdWx0OiBCZW5jaG1hcmsgPSA8QmVuY2htYXJrPmUudGFyZ2V0O1xuICAgICAgICAgICAgICAgICAgICByZXN1bHRzW2JlbmNoUmVzdWx0LmlkXSA9IDxSdW5uZXJSZXN1bHQ+e1xuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IGJlbmNoUmVzdWx0LmlkLFxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGJlbmNoUmVzdWx0LmVycm9yID8gQmVuY2htYXJrLmpvaW4oYmVuY2hSZXN1bHQuZXJyb3IpIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wc1BlclNlYzogYmVuY2hSZXN1bHQuaHoudG9GaXhlZChiZW5jaFJlc3VsdC5oeiA8IDEwMCA/IDIgOiAwKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wc1BlclNlY0Zvcm1hdHRlZDogQmVuY2htYXJrLmZvcm1hdE51bWJlcihiZW5jaFJlc3VsdC5oei50b0ZpeGVkKGJlbmNoUmVzdWx0Lmh6IDwgMTAwID8gMiA6IDApKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHBtOiBiZW5jaFJlc3VsdC5zdGF0cy5ybWUudG9GaXhlZCgyKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHJ1blNhbXBsZXM6IGJlbmNoUmVzdWx0LnN0YXRzLnNhbXBsZS5sZW5ndGhcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgUnVubmVyLnJlbmRlclJlc3VsdChiZW5jaFJlc3VsdC5pZCwgcmVzdWx0c1tiZW5jaFJlc3VsdC5pZF0ub3BzUGVyU2VjRm9ybWF0dGVkICsgJyAoJnBsdXNtbjsnICsgcmVzdWx0c1tiZW5jaFJlc3VsdC5pZF0ucG0gKyAnKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgLy8gS2VlcCB0aGUgb3JpZ2luYWwgb3JkZXIsIGV2ZW4gaWYgdGhlIGNvZGUgY29udGVudCBvciB0aXRsZSBjaGFuZ2VzLlxuICAgICAgICAgICAgYmVuY2hlcy5wdXNoKGJlbmNoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgQmVuY2htYXJrLmludm9rZShiZW5jaGVzLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3J1bicsXG4gICAgICAgICAgICAgICAgYXJnczogdHJ1ZSxcbiAgICAgICAgICAgICAgICAvLyAncXVldWVkJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBvblN0YXJ0OiAoZTogQmVuY2htYXJrLkV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdTdGFydGluZyBiZW5jaG1hcmtzIC4uLicsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25DeWNsZTogKGU6IEJlbmNobWFyay5FdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25DeWNsZSBoZXJlLicsIGUpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25FcnJvcjogKGU6IEJlbmNobWFyay5FdmVudCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25FcnJvciBoZXJlLicsIGUpO1xuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZFEucmVqZWN0KG5ldyBFcnJvcignUnVubmluZyBzdWl0ZSByZXR1cm5lZCBhbiBlcnJvci4nKSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoZTogQmVuY2htYXJrLkV2ZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbkNvbXBsZXRlIGhlcmUuJywgZSwgcmVzdWx0cyk7XG5cbiAgICAgICAgICAgICAgICAgICAgUnVubmVyLnJlbmRlcldpbm5lclJlc3VsdChCZW5jaG1hcmsuZmlsdGVyKGJlbmNoZXMsICdmYXN0ZXN0JylbMF0uaWQpO1xuICAgICAgICAgICAgICAgICAgICBSdW5uZXIucmVuZGVyTG9zZXJSZXN1bHQoQmVuY2htYXJrLmZpbHRlcihiZW5jaGVzLCAnc2xvd2VzdCcpWzBdLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWRRLnJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIDIwMDApO1xuXG4gICAgICAgIHJldHVybiBkZWZlcnJlZFEucHJvbWlzZTtcbiAgICB9XG5cbiAgICBwcm90ZWN0ZWQgc3RhdGljIHJlbmRlclJlc3VsdChpZDogc3RyaW5nIHwgbnVtYmVyLCB0ZXh0OiBzdHJpbmcpIHtcbiAgICAgICAgdmFyICRlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Rlc3RjYXNlLXRlc3QtcmVzdWx0LXRleHQtJyArIGlkKTtcbiAgICAgICAgJGVsZW0uaW5uZXJIVE1MID0gdGV4dDtcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIHN0YXRpYyByZW5kZXJXaW5uZXJSZXN1bHQoaWQ6IHN0cmluZyB8IG51bWJlcikge1xuICAgICAgICB2YXIgJGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgndGVzdGNhc2UtdGVzdC1yZXN1bHQtdGV4dC0nICsgaWQpO1xuICAgICAgICAkZWxlbS5jbGFzc05hbWUgKz0gJyBzdWNjZXNzJztcbiAgICB9O1xuXG4gICAgcHJvdGVjdGVkIHN0YXRpYyByZW5kZXJMb3NlclJlc3VsdChpZDogc3RyaW5nIHwgbnVtYmVyKSB7XG4gICAgICAgIHZhciAkZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd0ZXN0Y2FzZS10ZXN0LXJlc3VsdC10ZXh0LScgKyBpZCk7XG4gICAgICAgICRlbGVtLmNsYXNzTmFtZSArPSAnIGRhbmdlcic7XG4gICAgfTtcblxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFJ1bm5lclJlc3VsdCB7XG4gICAgaWQ6IG51bWJlcjtcbiAgICBlcnJvcjogc3RyaW5nO1xuICAgIG9wc1BlclNlYzogc3RyaW5nO1xuICAgIG9wc1BlclNlY0Zvcm1hdHRlZDogc3RyaW5nO1xuICAgIHBtOiBzdHJpbmc7XG4gICAgcnVuU2FtcGxlczogbnVtYmVyO1xufVxuIiwiaW1wb3J0IHtVdGlsfSBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7UnVubmVyUmVzdWx0fSBmcm9tICcuL1J1bm5lcic7XG5cbmV4cG9ydCBjbGFzcyBUZXN0Q2FzZSB7XG4gICAgcHJvdGVjdGVkIF90aXRsZTogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBfc2x1Zzogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBfZGVzY3JpcHRpb246IHN0cmluZztcbiAgICBwcm90ZWN0ZWQgX3N0YXR1czogc3RyaW5nO1xuICAgIHByb3RlY3RlZCBfaGFybmVzczogVGVzdENhc2VIYXJuZXNzO1xuICAgIHByb3RlY3RlZCBfZW50cmllczogVGVzdENhc2VFbnRyeVtdO1xuICAgIHByb3RlY3RlZCBfZW52OiBUZXN0Q2FzZUVudjtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcih0ZXN0Q2FzZTogVGVzdENhc2VFbnRpdHkpIHtcbiAgICAgICAgdGhpcy50aXRsZSA9IHRlc3RDYXNlLnRpdGxlO1xuICAgICAgICB0aGlzLnNsdWcgPSB0ZXN0Q2FzZS5zbHVnO1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gdGVzdENhc2UuZGVzY3JpcHRpb247XG4gICAgICAgIHRoaXMuc3RhdHVzID0gdGVzdENhc2Uuc3RhdHVzO1xuICAgICAgICB0aGlzLmhhcm5lc3MgPSB0ZXN0Q2FzZS5oYXJuZXNzO1xuICAgICAgICB0aGlzLmVudHJpZXMgPSB0ZXN0Q2FzZS5lbnRyaWVzO1xuICAgICAgICB0aGlzLmVudiA9IHRlc3RDYXNlLmVudjtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHRpdGxlKHRpdGxlOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fdGl0bGUgPSB0aXRsZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IHRpdGxlKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl90aXRsZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHNsdWcoc2x1Zzogc3RyaW5nKSB7XG4gICAgICAgIHRoaXMuX3NsdWcgPSBzbHVnO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgc2x1ZygpOiBzdHJpbmcge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2x1ZztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGRlc2NyaXB0aW9uKGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcbiAgICAgICAgdGhpcy5fZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0IGRlc2NyaXB0aW9uKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IHN0YXR1cyhzdGF0dXM6IHN0cmluZykge1xuICAgICAgICB0aGlzLl9zdGF0dXMgPSBzdGF0dXM7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBzdGF0dXMoKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3N0YXR1cztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGhhcm5lc3MoaGFybmVzczogVGVzdENhc2VIYXJuZXNzKSB7XG4gICAgICAgIHRoaXMuX2hhcm5lc3MgPSBoYXJuZXNzO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgaGFybmVzcygpOiBUZXN0Q2FzZUhhcm5lc3Mge1xuICAgICAgICByZXR1cm4gdGhpcy5faGFybmVzcztcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGVudHJpZXMoZW50cmllczogVGVzdENhc2VFbnRyeVtdKSB7XG4gICAgICAgIHRoaXMuX2VudHJpZXMgPSBlbnRyaWVzO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgZW50cmllcygpOiBUZXN0Q2FzZUVudHJ5W10ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW50cmllcztcbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkRW50cnkoZW50cnk6IFRlc3RDYXNlRW50cnkpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5fZW50cmllc1tlbnRyeS5pZF0gPSBlbnRyeTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlRW50cnkoaWQ6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBkZWxldGUgdGhpcy5fZW50cmllc1tpZF07XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBlbnYoZW52OiBUZXN0Q2FzZUVudikge1xuICAgICAgICB0aGlzLl9lbnYgPSBlbnY7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBlbnYoKTogVGVzdENhc2VFbnYge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW52O1xuICAgIH1cblxuICAgIHB1YmxpYyBpc1JlYWR5VG9SdW4oKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiAoVXRpbC5nZXRPYmpMZW5ndGgodGhpcy5lbnRyaWVzKSA+PSAyKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGNyZWF0ZSh0ZXN0Q2FzZUVudGl0eTogVGVzdENhc2VFbnRpdHkpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBUZXN0Q2FzZSh0ZXN0Q2FzZUVudGl0eSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVFbXB0eUVudGl0eSgpOiBUZXN0Q2FzZUVudGl0eSB7XG4gICAgICAgIHJldHVybiA8VGVzdENhc2VFbnRpdHk+e1xuICAgICAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICAgICAgc2x1ZzogVXRpbC5yYW5kb21TdHJpbmcoMTApLFxuICAgICAgICAgICAgZGVzY3JpcHRpb246ICcnLFxuICAgICAgICAgICAgc3RhdHVzOiAncHVibGljJyxcbiAgICAgICAgICAgIGhhcm5lc3M6IDxUZXN0Q2FzZUhhcm5lc3M+e1xuICAgICAgICAgICAgICAgIGh0bWw6ICcnLFxuICAgICAgICAgICAgICAgIHNldFVwOiAnJyxcbiAgICAgICAgICAgICAgICB0ZWFyRG93bjogJydcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlbnRyaWVzOiBbXG4gICAgICAgICAgICAgICAgPFRlc3RDYXNlRW50cnk+e2lkOiAxLCB0aXRsZTogJycsIGNvZGU6ICcnfSxcbiAgICAgICAgICAgICAgICA8VGVzdENhc2VFbnRyeT57aWQ6IDIsIHRpdGxlOiAnJywgY29kZTogJyd9XG4gICAgICAgICAgICBdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVFbnRpdHlGcm9tRE9NRWxlbWVudChpZDogc3RyaW5nKTogVGVzdENhc2VFbnRpdHkge1xuICAgICAgICB2YXIgJGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG4gICAgICAgIHZhciByZXN1bHQgPSAgPHt0ZXN0Q2FzZTogVGVzdENhc2VFbnRpdHl9PmZvcm1Ub09iamVjdCgkZWxlbSk7XG4gICAgICAgIHJldHVybiByZXN1bHQudGVzdENhc2U7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBjcmVhdGVFbXB0eVRlc3RDYXNlRW50cnkoaWQ6IG51bWJlcikge1xuICAgICAgICByZXR1cm4gPFRlc3RDYXNlRW50cnk+e1xuICAgICAgICAgICAgaWQ6IGlkLFxuICAgICAgICAgICAgdGl0bGU6ICcnLFxuICAgICAgICAgICAgY29kZTogJydcbiAgICAgICAgfTtcbiAgICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVGVzdENhc2VFbnRpdHkge1xuICAgIHRpdGxlOiBzdHJpbmc7XG4gICAgc2x1Zzogc3RyaW5nO1xuICAgIGRlc2NyaXB0aW9uOiBzdHJpbmc7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgaGFybmVzczogVGVzdENhc2VIYXJuZXNzO1xuICAgIGVudHJpZXM6IFRlc3RDYXNlRW50cnlbXTtcbiAgICBlbnY6IFRlc3RDYXNlRW52O1xufVxuXG5pbnRlcmZhY2UgVGVzdENhc2VIYXJuZXNzIHtcbiAgICBodG1sOiBzdHJpbmc7XG4gICAgc2V0VXA6IHN0cmluZztcbiAgICB0ZWFyRG93bjogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGVzdENhc2VFbnRyeSB7XG4gICAgaWQ6IG51bWJlcjtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIGNvZGU6IHN0cmluZztcbiAgICByZXN1bHRzPzogUnVubmVyUmVzdWx0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRlc3RDYXNlRW52IHtcbiAgICBicm93c2VyTmFtZTogc3RyaW5nO1xuICAgIGJyb3dzZXJWZXJzaW9uOiBzdHJpbmc7XG4gICAgb3M6IHN0cmluZztcbn1cbiIsImltcG9ydCB7VGVzdENhc2V9IGZyb20gJy4vVGVzdENhc2UnO1xuaW1wb3J0IHtQYWdlfSBmcm9tICcuL1BhZ2UnO1xuaW1wb3J0IHtQYW5lbH0gZnJvbSAnLi9QYW5lbCc7XG5pbXBvcnQge0h0dHBSZXNwb25zZUludGVyZmFjZX0gZnJvbSAnLi9IdHRwJztcbmltcG9ydCB7QXBwfSBmcm9tICcuL0FwcCc7XG5pbXBvcnQgUHJvbWlzZSA9IFEuUHJvbWlzZTtcblxuZXhwb3J0IGNsYXNzIFRvdGFsQ2hhcnRQYW5lbCBpbXBsZW1lbnRzIFBhbmVsIHtcbiAgICBwcm90ZWN0ZWQgcGFnZTogUGFnZTtcbiAgICBwcm90ZWN0ZWQgdGVzdENhc2U6IFRlc3RDYXNlO1xuXG4gICAgY29uc3RydWN0b3IocGFnZTogUGFnZSwgdGVzdENhc2U6IFRlc3RDYXNlKSB7XG4gICAgICAgIHRoaXMucGFnZSA9IHBhZ2U7XG4gICAgICAgIHRoaXMudGVzdENhc2UgPSB0ZXN0Q2FzZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0RGF0YSgpOiBQcm9taXNlPEh0dHBSZXNwb25zZUludGVyZmFjZT4ge1xuICAgICAgICByZXR1cm4gQXBwLmh0dHAuZ2V0SlNPTihgJHtBcHAuY29uZmlnLnNlcnZlclVyaX0vdGVzdC8ke3RoaXMudGVzdENhc2Uuc2x1Z30vdG90YWxzL2J5LWJyb3dzZXIuanNvbmApO1xuICAgIH1cblxuICAgIC8vIEB0b2RvIFNpbXBsaWZ5IHRoaXMgYnkgYWRkaW5nIGEgM3JkcGFydHkgY2hhcnQgbGlicmFyeS5cbiAgICBwdWJsaWMgcmVuZGVyKGRhdGE6IFRvdGFsQnlCcm93c2VyW10pIHtcbiAgICAgICAgdmFyICRjaGFydERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydC1yZXN1bHRzJyk7XG4gICAgICAgIGlmICgkY2hhcnREaXYuY2xhc3NOYW1lID09PSAncmVuZGVyZWQnKSB7XG4gICAgICAgICAgICB0aGlzLl9yZW5kZXIoZGF0YSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnb29nbGUuY2hhcnRzLmxvYWQoJ2N1cnJlbnQnLCB7cGFja2FnZXM6IFsnY29yZWNoYXJ0JywgJ2JhciddfSk7XG4gICAgICAgICAgICBnb29nbGUuY2hhcnRzLnNldE9uTG9hZENhbGxiYWNrKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLl9yZW5kZXIoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByb3RlY3RlZCBfcmVuZGVyKGRhdGE6IFRvdGFsQnlCcm93c2VyW10pIHtcbiAgICAgICAgdmFyICRjaGFydERpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGFydC1yZXN1bHRzJyk7XG4gICAgICAgIHZhciBjaGFydCA9IG5ldyBnb29nbGUudmlzdWFsaXphdGlvbi5CYXJDaGFydCgkY2hhcnREaXYpO1xuXG4gICAgICAgIHZhciBicm93c2VyczogYW55W10gPSBbXTtcbiAgICAgICAgdmFyIHJlc3VsdHNTZXQ6IGFueVtdID0gW107XG5cbiAgICAgICAgZGF0YS5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICAgICAgICB2YXIgZW50cnlSZXN1bHRzOiBhbnkgPSB7XG4gICAgICAgICAgICAgICAgdGl0bGU6IGVudHJ5LnRpdGxlXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgZW50cnkudG90YWxzLmZvckVhY2goZnVuY3Rpb24odG90YWwpIHtcbiAgICAgICAgICAgICAgICB2YXIgYnJvd3NlcklkZW50aWZpZXIgPSB0b3RhbC5icm93c2VyTmFtZTtcbiAgICAgICAgICAgICAgICBpZiAoYnJvd3NlcnMuaW5kZXhPZihicm93c2VySWRlbnRpZmllcikgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGJyb3dzZXJzLnB1c2goYnJvd3NlcklkZW50aWZpZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbnRyeVJlc3VsdHNbYnJvd3NlcklkZW50aWZpZXJdID0gcGFyc2VJbnQodG90YWwubWV0cmljVmFsdWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXN1bHRzU2V0LnB1c2goXy5tYXAoZW50cnlSZXN1bHRzKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyb3dzZXJzLnVuc2hpZnQoJ1RvdGFsJyk7XG4gICAgICAgIHJlc3VsdHNTZXQudW5zaGlmdChicm93c2Vycyk7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICBsZWdlbmQ6IHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbjogJ2JvdHRvbSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBiYXJzOiAnaG9yaXpvbnRhbCcsXG4gICAgICAgICAgICBjaGFydEFyZWE6IHtcbiAgICAgICAgICAgICAgICB3aWR0aDogJzEwMCUnLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJzgwJSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjaGFydC5kcmF3KFxuICAgICAgICAgICAgZ29vZ2xlLnZpc3VhbGl6YXRpb24uYXJyYXlUb0RhdGFUYWJsZShyZXN1bHRzU2V0KSxcbiAgICAgICAgICAgIG9wdGlvbnNcbiAgICAgICAgKTtcbiAgICAgICAgJGNoYXJ0RGl2LmNsYXNzTmFtZSA9ICdyZW5kZXJlZCc7XG4gICAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFRvdGFsQnlCcm93c2VyIHtcbiAgICB0aXRsZTogc3RyaW5nO1xuICAgIHRvdGFsczogVG90YWxCeUJyb3dzZXJNZXRyaWNbXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBUb3RhbEJ5QnJvd3Nlck1ldHJpYyB7XG4gICAgYnJvd3Nlck5hbWU6IHN0cmluZztcbiAgICBtZXRyaWNUeXBlOiBzdHJpbmc7XG4gICAgbWV0cmljVmFsdWU6IHN0cmluZztcbiAgICBydW5Db3VudDogc3RyaW5nO1xufVxuIiwiZXhwb3J0IGNsYXNzIFV0aWwge1xuICAgIHB1YmxpYyBzdGF0aWMgcmFuZG9tU3RyaW5nKGxlbjogbnVtYmVyLCBjaGFyU2V0Pzogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgY2hhclNldCA9IGNoYXJTZXQgfHwgJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5JztcbiAgICAgICAgdmFyIHJhbmRvbVN0cmluZyA9ICcnO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmFuZG9tUG96ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhclNldC5sZW5ndGgpO1xuICAgICAgICAgICAgcmFuZG9tU3RyaW5nICs9IGNoYXJTZXQuc3Vic3RyaW5nKHJhbmRvbVBveiwgcmFuZG9tUG96ICsgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJhbmRvbVN0cmluZztcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBHZXQgdGhlIHJlYWwgbnVtYmVyIG9mIHByb3BlcnRpZXMgZnJvbSBhbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb1xuICAgICAqIEByZXR1cm5zIHtudW1iZXJ9XG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBnZXRPYmpMZW5ndGgobzogT2JqZWN0KTogbnVtYmVyIHtcbiAgICAgICAgaWYgKHR5cGVvZiBvICE9PSAnb2JqZWN0JyB8fCBvID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBsOiBudW1iZXIgPSAwO1xuICAgICAgICB2YXIgazogYW55O1xuXG4gICAgICAgIGlmICh0eXBlb2YgT2JqZWN0LmtleXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGwgPSBPYmplY3Qua2V5cyhvKS5sZW5ndGg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGsgaW4gbykge1xuICAgICAgICAgICAgICAgIGlmIChvLmhhc093blByb3BlcnR5KGspKSB7XG4gICAgICAgICAgICAgICAgICAgIGwrKztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbDtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGVzY2FwZUZvclJlZ2V4KHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbiAgICAgICAgcmV0dXJuIHN0ci5yZXBsYWNlKC9bLVxcL1xcXFxeJCorPy4oKXxbXFxdXS9nLCAnXFxcXCQmJyk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtBcHB9IGZyb20gJy4vQXBwJztcblxubGV0IHNlcnZlclVyaSA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0ID09PSAnanNiZW5jaC5vcmcnID8gJ2h0dHA6Ly9hcGkuanNiZW5jaC5vcmcvdjInIDogJ2h0dHA6Ly9hcGktZGV2LmpzYmVuY2gub3JnL3YyJztcbmxldCBjbGllbnRVcmkgPSAnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdDtcblxubmV3IEFwcCh7XG4gICAgc2VydmVyVXJpOiBzZXJ2ZXJVcmksXG4gICAgY2xpZW50VXJpOiAgY2xpZW50VXJpXG59KTtcbiJdfQ==

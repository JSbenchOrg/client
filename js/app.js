var App = (function() {

    'use strict';

    Handlebars.registerHelper('if_eq', function(a, b, opts) {
        if(a == b) {
            return opts.fn(this);
        } else {
            return opts.inverse(this);
        }
    });

    Handlebars.registerHelper('timestamp', function() {
        return (new Date()).getTime();
    });

    function randomString(len, charSet) {
        charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var randomString = '';
        for (var i = 0; i < len; i++) {
            var randomPoz = Math.floor(Math.random() * charSet.length);
            randomString += charSet.substring(randomPoz,randomPoz+1);
        }
        return randomString;
    }

    /**
     * Get the real number of properties from an object.
     *
     * @param {object} o
     * @returns {number}
     */
    function getObjLength(o) {
        if (typeof o !== 'object' || o === null) {
            return 0;
        }

        var l = 0;
        var k;

        if (typeof Object.keys === 'function') {
            l = Object.keys(o).length;
        } else {
            for (k in o) {
                if (o.hasOwnProperty(k)) {
                    l++;
                }
            }
        }

        return l;
    }

    function fromStringToJSON(str) {
        return str ? JSON.parse(str) : {};
    }

    function fromJSONToString(jsonObj) {
        return JSON.stringify(jsonObj);
    }

    function getEmptyTestCaseDTO() {
        return {
            title: '',
            slug: randomString(10),
            description: '',
            status: 'public',
            harness: {
                html: '',
                setUp: '',
                tearDown: ''
            },
            entries: {
                1: {id: 1, title: '', code: ''},
                2: {id: 2, title: '', code: ''},
                3: {id: 3, title: '', code: ''}
            }
        };
    }

    var CLIENT_URL = 'http://' + window.location.host;
    var SERVER_URL = 'http://api.jsbench.org';
    // Compiled object with the TestCase details
    // and test results.
    var testCaseDTO  = {};

    function App() {
        App.Http = new Http();
        App.TestCasePage = TestCasePage;
        App.TestCaseRunner = TestCaseRunner;
        App.Router = new Router();

        this.bindEvents();
    }

    App.prototype.bindEvents = function() {
        this.bindErrorLogging();
    };

    App.prototype.bindErrorLogging = function() {
        if (!("onerror" in window)) {
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

            App.Http.postJSON(SERVER_URL + '/log.json', errorDTO).then(function() {
                timeStamp = (new Date()).getTime();
            });
        };

    };

    function Router() {
        var path = window.location.pathname;
        var fragments = path.split('/');
        var entity = fragments[1];
        var entitySlug = fragments[2];

        // @todo Switch page here.
        var page = new TestCasePage(entity === 'test' && entitySlug !== '' ? entitySlug : null);
        page.render().then(function() {
            page.bindEvents();
        });
    }

    function Http() {
    }

    Http.prototype.getJSON = function(url) {
        return this.httpRequest(url, 'GET', {'Content-Type': 'application/json', 'Accept': 'application/json'}, null);
    };

    Http.prototype.postJSON = function(url, body) {
        return this.httpRequest(url, 'POST', {'Content-Type': 'application/json', 'Accept': 'application/json'}, body);
    };

    Http.prototype.getHTML = function(url) {
        return this.httpRequest(url, 'GET', {'Content-Type': 'text/html', 'Accept': 'text/html'}, null);
    };

    Http.prototype.httpRequest = function(url, method, headers, body) {
        var deferred = Q.defer();

        var xhr = typeof XMLHttpRequest !== 'undefined' ? new XMLHttpRequest() : null;

        xhr.open(method, url, true);

        (function(headers){
            for (var i in headers) {
                if (headers.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, headers[i]);
                }
            }
        })(headers);

        xhr.onload = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 201) {
                    var response = {
                        'status': xhr.status,
                        'body': headers && headers['Accept'] === 'application/json' ? fromStringToJSON(xhr.response) : xhr.response
                    };
                    console.log('Http response:', response);
                    deferred.resolve(response);
                } else {
                    deferred.reject('There was an error with your HTTP request.');
                }
            }
        };

        if (body) {
            xhr.send(fromJSONToString(body));
        } else {
            xhr.send();
        }

        return deferred.promise;
    };



    function TestCasePage(slug) {
        this.slug = slug;
    }

    TestCasePage.prototype.renderSidebar = function(html, data) {
        var $elem = document.getElementById('testcase-sidebar-form');
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    };

    TestCasePage.prototype.renderListing = function(html, data) {
        var $elem = document.getElementById('testcase-sidebar-listing');
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    };

    TestCasePage.prototype.renderMain = function(html, data) {
        var $elem = document.getElementById('testcase-main-form');
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    };

    TestCasePage.prototype.render = function() {
        var slug = this.slug;

        var getSidebarListingPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase-sidebar-listing.hbs');
        var getSidebarFormPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase-sidebar-form.hbs');
        var getEntryFormPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase-entry-form.hbs');
        var getMainFormPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase-main-form.hbs');
        var getDataPromise = Q.fcall(function () {
            if (!slug) {
                return {
                    body: getEmptyTestCaseDTO()
                };
            }
            return App.Http.getJSON(SERVER_URL + '/test/' + slug + '.json');
        });

        var getListingPromise = App.Http.getJSON(SERVER_URL + '/tests.json?exclude=revision_number,description,harness,entries,status&orderBy=latest&limit=25');

        return Q.spread(
            [getSidebarFormPromise, getEntryFormPromise, getMainFormPromise,
            getSidebarListingPromise, getDataPromise, getListingPromise],
                    function(sidebarFormR, entryFormR, mainFormR, sidebarListingR, dataR, listingR) {
                        this.renderSidebar(sidebarFormR.body, dataR.body);
                        Handlebars.registerPartial("entry", entryFormR.body);
                        this.renderListing(sidebarListingR.body, {entries: listingR.body});
                        this.renderMain(mainFormR.body, dataR.body);
                }.bind(this));
    };

    TestCasePage.prototype.bindEvents = function() {
        this.bindSaveBtn();
        this.bindRunBtn();
        this.bindAddNewTestBtn();
        this.bindRemoveEntry();
        this.bindLatestTestCasesLinks();
        return true;
    };

    TestCasePage.prototype.bindSaveBtn = function() {
        var $dataElem = document.getElementById('wrapper');
        var $saveBtn = document.getElementById('save-testcase-button');

        // @todo Duplicate code like 'runBtn'.
        $saveBtn.addEventListener('click', function(e) {
            e.preventDefault();

            TestCasePage.toggleBtn('save-testcase-button', 'disable');

            // Store the current TestCase properties.
            var formResult = formToObject($dataElem);

            // @todo Factory for testCase.
            var testCaseDTO = formResult.testCase;

            // Append the browser data.
            testCaseDTO.env = {
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };

            App.Http.postJSON(SERVER_URL + '/tests.json', testCaseDTO).then(function() {
                TestCasePage.toggleBtn('save-testcase-button', 'active');
            });
        });
    };

    TestCasePage.prototype.bindRunBtn = function() {
        var $dataElem = document.getElementById('wrapper');
        var $runBtn = document.getElementById('run-testcase-button');

        // 'Run tests' button.
        $runBtn.addEventListener('click', function(e) {
            e.preventDefault();

            TestCasePage.toggleBtn('run-testcase-button', 'disable');

            // Store the current TestCase properties.
            var formResult = formToObject($dataElem);

            // @todo Factory for testCase.
            var testCaseDTO = formResult.testCase;

            // Append the browser data.
            testCaseDTO.env = {
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };

            // Render 'Results' panel with preliminary data.
            (new ResultsPanel(testCaseDTO)).render().then(function() {
                // Create the JS code and run it in browser.
                (new TestCaseRunner(testCaseDTO));
            });

        }, false);
    };

    TestCasePage.prototype.bindRemoveEntry = function() {
        var $entries = document.getElementById('entries');
        var $buttons = $entries.getElementsByClassName('testcase-test-remove');
        for (var i = 0; i < $buttons.length; i++) {
            $buttons[i].addEventListener('click', function(e) {
                var entryId = e.target.dataset.entryId;
                var $entry = document.getElementById('testcase-test-' + entryId);
                $entries.removeChild($entry);
            });
        }
    };

    TestCasePage.prototype.bindAddNewTestBtn = function() {
        // 'Add new test' button.
        var $btn = document.getElementById('add-test-link');
        $btn.addEventListener('click', function(e) {
            e.preventDefault();
            var getEntryFormPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase-entry-form.hbs');
            Q.spread([getEntryFormPromise], function(response) {
                // @todo Refactor into renderEntryForm().
                // @todo Create Entry entity.
                var template = Handlebars.compile(response.body);
                var html = template({ id: 4, title: '', code: ''});
                var $newEntry = document.createElement('div');
                $newEntry.innerHTML = html;
                var $entries = document.getElementById('entries');
                $entries.appendChild($newEntry.firstChild);

            });
        });
    };

    TestCasePage.prototype.bindLatestTestCasesLinks = function() {
        var $openBtns = document.getElementsByClassName('sidebar-listing-item');

        var openTestCaseHandler = function(e) {
            e.preventDefault();
            var slug = e.target.getAttribute('data-slug');
            history.pushState({}, null, '/test/' + slug);

            App.Router = new Router();
            TestCaseRunner.drawChart({
                body: {
                    slug: slug
                }
            });
        };

        for (var i = 0; i < $openBtns.length; i++) {
            $openBtns[i].addEventListener('click', openTestCaseHandler, false);
        }
    };

    TestCasePage.toggleBtn = function(id, status) {
        var $btn = document.getElementById(id);

        if (status === 'active') {
            $btn.classList.remove('btn-loading');
            $btn.disabled = false;
        } else {
            $btn.className += ' btn-loading';
            $btn.disabled = true;
        }
    };

    function TestCaseRunner(testCase) {
        return this.generateJSCode(testCase);
    }

    TestCaseRunner.prototype.generateJSCode = function(testCase) {
        // Basic checks.
        if (!testCase || getObjLength(testCase.entries) === 0) {
            return false;
        }

        // Template for test Runner.
        var getTplPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase.js.hbs');
        return Q.spread([getTplPromise], function(response) {
                    this.render(response.body, testCase);
                }.bind(this));
    };

    TestCaseRunner.prototype.render = function(html, data) {
        if (!html) {
            return false;
        }

        var template = Handlebars.compile(html);
        var jsCode = template(data);

        var elemId = 'testcase-script-container';
        var $elem = document.getElementById(elemId);
        // If it exist, delete.
        if ($elem) {
            $elem.parentNode.removeChild($elem);
        }
        // Re-add the DOM element.
        $elem = document.createElement('script');
        $elem.async = true;
        $elem.text = jsCode;
        $elem.id = elemId;
        document.body.appendChild($elem);
    };

    TestCaseRunner.renderResult = function(id, text) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.innerHTML = text;
        //$elem.textContent = text;
        // result.runSamples
    };

    TestCaseRunner.renderWinnerResult = function(id) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' success';
    };

    TestCaseRunner.renderLoserResult = function(id) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' danger';
    };

    TestCaseRunner.pushResults = function(results) {
        if (!results) {
            return false;
        }

        var formResults = formToObject(document.getElementById('wrapper'));
        var testCaseDTO = formResults.testCase;

        // Append the results.
        // Keep the original form order.
        // That's why results is an object starting from key 1.
        for (var i in results) {
            if (!results.hasOwnProperty(i)) {
                continue;
            }
            testCaseDTO.entries[i].results = results[i];
        }

        // Append the browser data.
        testCaseDTO.env = {
            browserName: platform.name,
            browserVersion: platform.version,
            os: platform.os
        };
        
        console.log(testCaseDTO, JSON.stringify(testCaseDTO));

        return App.Http.postJSON(SERVER_URL + '/tests.json', testCaseDTO);
    };

    TestCaseRunner.drawChart = function(response) {
        return App.Http.getJSON(SERVER_URL + '/test/' + response.body.slug + '/totals/by-browser.json')
            .then(function(response) {
                new ChartPanel(response.body);
            });
    };

    function ResultsPanel(testCase) {
        this.testCase = testCase;
    }

    ResultsPanel.prototype.render = function() {
        var getResultsTplPromise = App.Http.getHTML(CLIENT_URL + '/tpl/testcase-results-table.hbs');

        return Q.spread([getResultsTplPromise], function(response) {
            this.renderResultsTable(response.body, this.testCase);
        }.bind(this));
    };

    ResultsPanel.prototype.renderResultsTable = function(html, data) {
        var $elem = document.getElementById('results');
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    };

    function ChartPanel(reportTotals) {
        if (!reportTotals) {
            return false;
        }

        this.reportTotals = reportTotals;
        var $chartDiv = document.getElementById('chart-div');
        if ($chartDiv.className === 'rendered') {
            this.renderResultsTable();
        } else {
            google.charts.load('current', {packages: ['corechart', 'bar']});
            google.charts.setOnLoadCallback(function() {
                this.renderResultsTable();
            }.bind(this));
        }
    }

    ChartPanel.prototype.renderResultsTable = function() {
        var $chartDiv = document.getElementById('chart-div');
        this.chart = new google.visualization.BarChart($chartDiv);

        var browsers = [];
        var resultsSet = [];

        this.reportTotals.map(function (entry) {
            var entryResults = {
                title: entry.title
            };
            entry.totals.forEach(function(total) {
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
                width: '80%',
                'height': '80%'
            }
        };

        var data = google.visualization.arrayToDataTable(resultsSet);
        this.chart.draw(data, options);
        $chartDiv.className = "rendered";
    };

    return App;
}());
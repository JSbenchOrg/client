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
//# sourceMappingURL=Page.js.map
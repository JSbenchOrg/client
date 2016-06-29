import {TestCase, TestCaseEnv} from './TestCase';
import {App} from './App';
import {HttpResponseInterface} from './Http';
import {Runner, RunnerResult} from './Runner';
import {TotalByBrowser, TotalChartPanel} from './TotalChartPanel';
import Promise = Q.Promise;

export class Page {
    protected testCase: TestCase;

    public constructor(testCase: TestCase) {
        console.log('TestCase constructor ...');
        this.testCase = testCase;
    }

    public static renderElem(id: string, html: string, data: Object) {
        var $elem = document.getElementById(id);
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    }

    public render() {
        // Render 'Sidebar'.
        App.http.getHTML(App.config.clientUri + '/tpl/testcase-sidebar-form.hbs')
            .then((r: HttpResponseInterface) => {
                Page.renderElem('testcase-sidebar-form', <string>r.getBody(), this.testCase);
            })
            .then(() => {
                this.bindSaveBtn();
                this.bindRunBtn();
            });

        // Render 'Listings'.
        Q.spread([
            // App.http.getJSON(App.config.serverUri + '/tests.json?exclude=revision_number,description,harness,entries,status&orderBy=latest&limit=25'),
            App.http.getHTML(App.config.clientUri + '/tpl/testcase-sidebar-listing.hbs')
        ], (dataR: HttpResponseInterface, tplR: HttpResponseInterface) => {
            Page.renderElem('testcase-sidebar-listing', <string>dataR.getBody(), tplR.getBody());
        });

        // Render 'Main form'.
        Q.spread([
            App.http.getHTML(App.config.clientUri + '/tpl/testcase-entry-form.hbs'),
            App.http.getHTML(App.config.clientUri + '/tpl/testcase-main-form.hbs')
        ], (tplEntryR: HttpResponseInterface, tplMainR: HttpResponseInterface) => {
            Handlebars.registerPartial('entry', tplEntryR.getBody());
            Page.renderElem('testcase-main-form', <string>tplMainR.getBody(), this.testCase);
        }).then(() => {
            this.bindAddTestEntryBtn();
        });
    }

    public static renderErrorPopup(error: ErrorResponseDTO) {
        console.log(error);
        var msgTxt: string = 'Some kind of error occurred.';
        if (error.error && error.error.message) {
            msgTxt = error.error.message;
        }
        window.alert(msgTxt);
    }

    public renderChartPanel() {
        var panel = new TotalChartPanel(this, this.testCase);
        panel.getData().then((r: HttpResponseInterface) => {
            panel.render(<TotalByBrowser[]>r.getBody());
        }, function(response: HttpResponseInterface) {
            Page.renderErrorPopup(<ErrorResponseDTO>response.getBody());
        });
    };

    protected bindSaveBtn() {
        var $saveBtn = document.getElementById('save-testcase-button');

        $saveBtn.addEventListener('click', (e) => {
            e.preventDefault();

            Page.toggleRenderBtn('save-testcase-button', 'disable');

            var testCaseDTO = TestCase.createEntityFromDOMElement('wrapper');
            // Append the browser data.
            testCaseDTO.env = <TestCaseEnv>{
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };

            App.http.postJSON(App.config.serverUri + '/tests.json', testCaseDTO)
                .then(function() {
                    Page.toggleRenderBtn('save-testcase-button', 'activate');
                }, function(response: HttpResponseInterface) {
                    Page.toggleRenderBtn('save-testcase-button', 'activate');
                    Page.renderErrorPopup(<ErrorResponseDTO>response.getBody());
                });
        });
    }

    protected bindRunBtn() {
        var _page = this;
        var $runBtn = document.getElementById('run-testcase-button');

        // 'Run tests' button.
        $runBtn.addEventListener('click', (e) => {
            e.preventDefault();

            Page.toggleRenderBtn('run-testcase-button', 'disable');

            var testCaseDTO = TestCase.createEntityFromDOMElement('wrapper');

            // Append the browser data.
            testCaseDTO.env = <TestCaseEnv>{
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };

            // Render 'Results' panel with preliminary data.
            App.http.getHTML(`${App.config.clientUri}/tpl/testcase-results-table.hbs`)
                .then((r: HttpResponseInterface) => {
                    Page.renderElem('results', <string>r.getBody(), testCaseDTO);

                    // Create the JS code and run it in browser.
                    var runner = new Runner(
                        new TestCase(testCaseDTO)
                    );
                    runner.run().then((results: RunnerResult[]) => {
                        // Re-activate 'Run' btn.
                        Page.toggleRenderBtn('run-testcase-button', 'activate');
                        // Send the test results.
                        _page.sendResults(results);
                        // Render 'Chart Panel'.
                        console.log('Rendering Chart Panel ...');
                        _page.renderChartPanel();
                    }, function(error) {
                        Page.renderErrorPopup(error);
                    });
                });

        }, false);
    }

    protected bindAddTestEntryBtn() {
        // 'Add new test' button.
        var $btn = document.getElementById('add-test-link');

        $btn.addEventListener('click', (e) => {
            e.preventDefault(); console.log('click?');

            App.http.getHTML(`${App.config.clientUri}/tpl/testcase-entry-form.hbs`).then((response: HttpResponseInterface) => {
                // Add to model.
                // @todo This should be the MVCs job.
                var entryId = Page.getNextTestCaseEntryId();
                var newTestEntry = TestCase.createEmptyTestCaseEntry(entryId);
                this.testCase.addEntry(newTestEntry);

                // Render new test entry.
                var template = Handlebars.compile(response.getBody());
                var html = template(newTestEntry);
                var $newEntry = document.createElement('div');
                $newEntry.innerHTML = html;
                var $entries = document.getElementById('entries');
                $entries.appendChild($newEntry.firstChild);
                // Bind events to it.
                this.bindRemoveTestEntryBtn(entryId);
            });
        });
    };

    protected bindRemoveTestEntryBtn(entryId: number) {
        var $entries = document.getElementById('entries');
        var $entry = document.getElementById('testcase-test-' + entryId);
        var $button = $entry.getElementsByClassName('testcase-test-remove');

        $button[0].addEventListener('click', (e) => {
            console.log('click?');

            // Remove from model.
            // @todo This should be the MVCs job.
            this.testCase.removeEntry(entryId);

            // Remove from DOM.
            $entries.removeChild($entry);
        });
    };

    protected static getNextTestCaseEntryId() {
        return document.getElementsByClassName('testcase-test').length + 1;
    }

    public static toggleRenderBtn(id: string, status: string) {
        var $btn = <HTMLButtonElement>document.getElementById(id);

        if (status === 'activate') {
            $btn.classList.remove('btn-loading');
            $btn.disabled = false;
        } else {
            $btn.className += ' btn-loading';
            $btn.disabled = true;
        }
    }

    public sendResults(results: RunnerResult[]): Promise<HttpResponseInterface> {

        // Refresh the testCase object.
        // @todo Model is not keeping up with DOM changes. Refactor.
        var testCaseDTO = TestCase.createEntityFromDOMElement('wrapper');

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
        testCaseDTO.env = <TestCaseEnv>{
            browserName: platform.name,
            browserVersion: platform.version,
            os: platform.os
        };

        console.log(testCaseDTO, JSON.stringify(testCaseDTO));

        // Update the model.
        this.testCase = TestCase.create(testCaseDTO);

        return App.http.postJSON(`${App.config.serverUri}/tests.json`, testCaseDTO);
    };

}

interface ButtonEventTarget extends EventTarget {
    dataset: {
        entryId: number;
    };
}

interface ErrorResponseDTO {
    error: {
        message: string,
        data: Array<{
            reason: string,
            code: string
        }>,
        code: string
    };
}

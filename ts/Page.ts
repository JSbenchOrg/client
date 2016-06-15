import {TestCase, TestCaseEnvInterface} from './TestCase';
import {App} from './App';
import {HttpResponseInterface} from './Http';

export class Page {
    protected testCase: TestCase;

    public constructor(testCase: TestCase) {
        this.testCase = testCase;
    }

    public static renderElem(id: string, html: string, data: Object) {
        var $elem = document.getElementById(id);
        var template = Handlebars.compile(html);
        $elem.innerHTML = template(data);
    }

    public render() {
        App.http.getHTML(App.config.clientUri + '/tpl/testcase-sidebar-form.hbs')
            .then((r) => {
                Page.renderElem('testcase-sidebar-form', <string>r.getBody(), this.testCase);
            })
            .then(() => {
                this.bindSaveBtn();
                this.bindRunBtn();
            });

        Q.spread([
            App.http.getJSON(App.config.clientUri + '/tests.json?exclude=revision_number,description,harness,entries,status&orderBy=latest&limit=25'),
            App.http.getHTML(App.config.clientUri + '/tpl/testcase-sidebar-listing.hbs')
        ], (dataR: HttpResponseInterface, tplR: HttpResponseInterface) => {
            Page.renderElem('testcase-sidebar-listing', <string>dataR.getBody(), tplR.getBody());
        });

        Q.spread([
            App.http.getHTML(App.config.clientUri + '/tpl/testcase-entry-form.hbs'),
            App.http.getHTML(App.config.clientUri + '/tpl/testcase-main-form.hbs')
        ], (tplEntryR: HttpResponseInterface, tplMainR: HttpResponseInterface) => {
            Handlebars.registerPartial('entry', tplEntryR.getBody());
            Page.renderElem('testcase-main-form', <string>tplMainR.getBody(), this.testCase);
        });
    }

    protected bindSaveBtn() {
        var $saveBtn = document.getElementById('save-testcase-button');

        $saveBtn.addEventListener('click', (e) => {
            e.preventDefault();

            Page.toggleRenderBtn('save-testcase-button', 'disable');

            var testCaseDTO = TestCase.createFromDOMElement('wrapper');
            // Append the browser data.
            testCaseDTO.env = <TestCaseEnvInterface>{
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };

            App.http.postJSON(App.config.clientUri + '/tests.json', testCaseDTO).then(function() {
                Page.toggleRenderBtn('save-testcase-button', 'activate');
            });
        });
    }

    protected bindRunBtn() {
        var $runBtn = document.getElementById('run-testcase-button');

        // 'Run tests' button.
        $runBtn.addEventListener('click', function(e) {
            e.preventDefault();

            Page.toggleRenderBtn('run-testcase-button', 'disable');

            var testCaseDTO = TestCase.createFromDOMElement('wrapper');

            // Append the browser data.
            testCaseDTO.env = <TestCaseEnvInterface>{
                browserName: platform.name,
                browserVersion: platform.version,
                os: platform.os
            };

            // Render 'Results' panel with preliminary data.
            // (new ResultsPanel(testCaseDTO)).render().then(function() {
                // Create the JS code and run it in browser.
             //   (new TestCaseRunner(testCaseDTO));
            // });

        }, false);
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

}

import {TestCase, TestCaseEnvInterface} from './TestCase';
import {App} from './App';
import {HttpResponseInterface} from './Http';
import Promise = Q.Promise;

export class Runner {
    protected testCase: TestCase;

    public constructor(testCase: TestCase) {
        this.testCase = testCase;
    }

    public run() {
        if (!this.testCase.isReadyToRun()) {
            return new Error('You need to have at least two code entries in order to run the test case.');
        }

        // Template for test Runner.
        App.http.getHTML(`${App.config.clientUri}/tpl/testcase.js.hbs`).then((response: HttpResponseInterface) => {
            Runner.renderJS(<string>response.getBody(), this.testCase);
        });
    }

    public static renderJS(html: string, data: Object) {
        if (!html) {
            return false;
        }

        var template = Handlebars.compile(html);
        var jsCode = template(data);

        var elemId = 'testcase-script-container';
        var $elem = <HTMLScriptElement>document.getElementById(elemId);
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
    }

    public static renderResult(id: string, text: string) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.innerHTML = text;
    };

    public static renderWinnerResult(id: string) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' success';
    };

    public static renderLoserResult(id: string) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' danger';
    };

    public static pushResults(results: RunnerResultInterface[]): Promise<HttpResponseInterface> {

        var testCaseDTO = TestCase.createFromDOMElement('wrapper');

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
        testCaseDTO.env = <TestCaseEnvInterface>{
            browserName: platform.name,
            browserVersion: platform.version,
            os: platform.os
        };

        console.log(testCaseDTO, JSON.stringify(testCaseDTO));

        return App.http.postJSON(`${App.config.clientUri}/tests.json`, testCaseDTO);
    };

}

export interface RunnerResultInterface {
    id: number;
    error: string;
    opsPerSec: number;
    opsPerSecFormatted: string;
    pm: string;
    runSamples: number;
}

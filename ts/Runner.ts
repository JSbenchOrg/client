import {TestCase} from './TestCase';
import {App} from './App';
import {HttpResponseInterface} from "./Http";

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
        App.http.getHTML(`${App.config.clientUri}/tpl/testcase.js.hbs`).then(function(response: HttpResponseInterface) {
            this.render(response.getBody(), testCase);
        }.bind(this));
    }

    protected renderJS(html: string, data: Object) {
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

    public static renderResult(id, text) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.innerHTML = text;
    };

    public static renderWinnerResult(id) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' success';
    };

    public static renderLoserResult(id) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' danger';
    };
}

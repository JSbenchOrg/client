import {TestCase} from './TestCase';
import {Page} from './Page';
import {Panel} from './Panel';
import {HttpResponseInterface} from './Http';
import {App} from './App';
import Promise = Q.Promise;

export class TotalChartPanel implements Panel {
    protected page: Page;
    protected testCase: TestCase;

    constructor(page: Page, testCase: TestCase) {
        this.page = page;
        this.testCase = testCase;
    }

    public getData(): Promise<HttpResponseInterface> {
        return App.http.getJSON(`${App.config.serverUri}/test/${this.testCase.slug}/totals/by-browser.json`);
    }

    // @todo Simplify this by adding a 3rdparty chart library.
    public render(data: TotalByBrowser[]) {
        var $chartDiv = document.getElementById('chart-div');
        if ($chartDiv.className === 'rendered') {
            this._render(data);
        } else {
            google.charts.load('current', {packages: ['corechart', 'bar']});
            google.charts.setOnLoadCallback(() => {
                this._render(data);
            });
        }
    }

    protected _render(data: TotalByBrowser[]) {
        var $chartDiv = document.getElementById('chart-div');
        var chart = new google.visualization.BarChart($chartDiv);

        var browsers: any[] = [];
        var resultsSet: any[] = [];

        data.map(function (entry) {
            var entryResults: any = {
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

        chart.draw(
            google.visualization.arrayToDataTable(resultsSet),
            options
        );
        $chartDiv.className = 'rendered';
    }
}

export interface TotalByBrowser {
    title: string;
    totals: TotalByBrowserMetric[];
}

export interface TotalByBrowserMetric {
    browserName: string;
    metricType: string;
    metricValue: string;
    runCount: string;
}

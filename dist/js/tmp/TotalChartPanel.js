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
//# sourceMappingURL=TotalChartPanel.js.map
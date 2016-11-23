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
//# sourceMappingURL=Runner.js.map
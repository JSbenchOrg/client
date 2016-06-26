import {TestCase} from './TestCase';
import Promise = Q.Promise;

export class Runner {
    protected testCase: TestCase;

    public constructor(testCase: TestCase) {
        this.testCase = testCase;
    }

    public run(): Promise<{[key: number]: RunnerResult}> {
        if (!this.testCase.isReadyToRun()) {
            throw new Error('You need to have at least two code entries in order to run the test case.');
        }

        console.log('Starting runner ...');
        return this.startBench();
    }

    protected startBench(): Promise<{[key: number]: RunnerResult}> {
        var deferredQ = Q.defer<{[key: number]: RunnerResult}>();

        var testCase = this.testCase;
        var benches: Benchmark[] = [];
        var bench: Benchmark;
        var results: {[key: number]: RunnerResult} = {};

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
                onStart: function(e: Benchmark.Event) {
                    var benchResult: Benchmark = <Benchmark>e.target;
                    Runner.renderResult(benchResult.id, 'Starting ...');
                },
                onComplete: function(e: Benchmark.Event) {
                    let benchResult: Benchmark = <Benchmark>e.target;
                    results[benchResult.id] = <RunnerResult>{
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
            // Keep the original order, even if the code content or title changes.
            benches.push(bench);
        }

        setTimeout(() => {
            Benchmark.invoke(benches, {
                name: 'run',
                args: true,
                // 'queued': true,
                onStart: (e: Benchmark.Event) => {
                    console.log('Starting benchmarks ...', e);
                },
                onCycle: (e: Benchmark.Event) => {
                    console.log('onCycle here.', e);
                },
                onError: (e: Benchmark.Event) => {
                    console.log('onError here.', e);
                    deferredQ.reject(new Error('Running suite returned an error.'));
                },
                onComplete: (e: Benchmark.Event) => {
                    console.log('onComplete here.', e, results);

                    Runner.renderWinnerResult(Benchmark.filter(benches, 'fastest')[0].id);
                    Runner.renderLoserResult(Benchmark.filter(benches, 'slowest')[0].id);
                    deferredQ.resolve(results);
                }
            });
        }, 2000);

        console.log('aici');

        return deferredQ.promise;
    }

    protected static renderResult(id: string | number, text: string) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.innerHTML = text;
    };

    protected static renderWinnerResult(id: string | number) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' success';
    };

    protected static renderLoserResult(id: string | number) {
        var $elem = document.getElementById('testcase-test-result-text-' + id);
        $elem.className += ' danger';
    };

}

export interface RunnerResult {
    id: number;
    error: string;
    opsPerSec: string;
    opsPerSecFormatted: string;
    pm: string;
    runSamples: number;
}

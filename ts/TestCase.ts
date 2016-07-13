import {Util} from './Utils';
import {RunnerResult} from './Runner';

export class TestCase {
    protected _title: string;
    protected _slug: string;
    protected _description: string;
    protected _status: string;
    protected _harness: TestCaseHarness;
    protected _entries: TestCaseEntry[];
    protected _env: TestCaseEnv;

    public constructor(testCase: TestCaseEntity) {
        this.title = testCase.title;
        this.slug = testCase.slug;
        this.description = testCase.description;
        this.status = testCase.status;
        this.harness = testCase.harness;
        this.entries = testCase.entries;
        this.env = testCase.env;
    }

    public set title(title: string) {
        this._title = title;
    }

    public get title(): string {
        return this._title;
    }

    public set slug(slug: string) {
        this._slug = slug;
    }

    public get slug(): string {
        return this._slug;
    }

    public set description(description: string) {
        this._description = description;
    }

    public get description(): string {
        return this._description;
    }

    public set status(status: string) {
        this._status = status;
    }

    public get status(): string {
        return this._status;
    }

    public set harness(harness: TestCaseHarness) {
        this._harness = harness;
    }

    public get harness(): TestCaseHarness {
        return this._harness;
    }

    public set entries(entries: TestCaseEntry[]) {
        this._entries = entries;
    }

    public get entries(): TestCaseEntry[] {
        return this._entries;
    }

    public addEntry(entry: TestCaseEntry): void {
        this._entries[entry.id] = entry;
    }

    public removeEntry(id: number): void {
        delete this._entries[id];
    }

    public set env(env: TestCaseEnv) {
        this._env = env;
    }

    public get env(): TestCaseEnv {
        return this._env;
    }

    public isReadyToRun(): boolean {
        return (Util.getObjLength(this.entries) >= 2);
    }

    public static create(testCaseEntity: TestCaseEntity) {
        return new TestCase(testCaseEntity);
    }

    public static createEmptyEntity(): TestCaseEntity {
        return <TestCaseEntity>{
            title: '',
            slug: Util.randomString(10),
            description: '',
            status: 'public',
            harness: <TestCaseHarness>{
                html: '',
                setUp: '',
                tearDown: ''
            },
            entries: [
                <TestCaseEntry>{id: 1, title: '', code: ''},
                <TestCaseEntry>{id: 2, title: '', code: ''}
            ]
        };
    }

    public static createEntityFromDOMElement(id: string): TestCaseEntity {
        var $elem = document.getElementById(id);
        var result =  <{testCase: TestCaseEntity}>formToObject($elem);
        return result.testCase;
    }

    public static createEmptyTestCaseEntry(id: number) {
        return <TestCaseEntry>{
            id: id,
            title: '',
            code: ''
        };
    }
}

export interface TestCaseEntity {
    title: string;
    slug: string;
    description: string;
    status: string;
    harness: TestCaseHarness;
    entries: TestCaseEntry[];
    env: TestCaseEnv;
}

interface TestCaseHarness {
    html: string;
    setUp: string;
    tearDown: string;
}

interface TestCaseEntry {
    id: number;
    title: string;
    code: string;
    results?: RunnerResult;
}

export interface TestCaseEnv {
    browserName: string;
    browserVersion: string;
    os: string;
}

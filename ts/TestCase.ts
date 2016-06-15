import {Util} from './Utils';

export class TestCase {
    protected _title: string;
    protected _slug: string;
    protected _description: string;
    protected _status: string;
    protected _harness: TestCaseHarnessInterface;
    protected _entries: TestCaseEntryInterface[];
    protected _env: TestCaseEnvInterface;

    public constructor(testCase: TestCaseEntityInterface) {
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

    public set harness(harness: TestCaseHarnessInterface) {
        this._harness = harness;
    }

    public get harness(): TestCaseHarnessInterface {
        return this._harness;
    }

    public set entries(entries: TestCaseEntryInterface[]) {
        this._entries = entries;
    }

    public get entries(): TestCaseEntryInterface[] {
        return this._entries;
    }

    public set env(env: TestCaseEnvInterface) {
        this._env = env;
    }

    public get env(): TestCaseEnvInterface {
        return this._env;
    }

    public static createEmpty(): TestCaseEntityInterface {
        return <TestCaseEntityInterface>{
            title: '',
            slug: Util.randomString(10),
            description: '',
            status: 'public',
            harness: <TestCaseHarnessInterface>{
                html: '',
                setUp: '',
                tearDown: ''
            },
            entries: [
                <TestCaseEntryInterface>{id: 1, title: '', code: ''},
                <TestCaseEntryInterface>{id: 2, title: '', code: ''}
            ]
        };
    }

    public static createFromDOMElement(id: string): TestCaseEntityInterface {
        var $elem = document.getElementById(id);
        var result =  <{testCase: TestCaseEntityInterface}>formToObject($elem);
        return result.testCase;
    }
}

export interface TestCaseEntityInterface {
    title: string;
    slug: string;
    description: string;
    status: string;
    harness: TestCaseHarnessInterface;
    entries: TestCaseEntryInterface[];
    env: TestCaseEnvInterface;
}

interface TestCaseHarnessInterface {
    html: string;
    setUp: string;
    tearDown: string;
}

interface TestCaseEntryInterface {
    id: number;
    title: string;
    code: string;
}

export interface TestCaseEnvInterface {
    browserName: string;
    browserVersion: string;
    os: string;
}

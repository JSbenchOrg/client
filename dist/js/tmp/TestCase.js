"use strict";
var Utils_1 = require('./Utils');
var TestCase = (function () {
    function TestCase(testCase) {
        this._title = null;
        this._slug = null;
        this._description = null;
        this._status = null;
        this.title = testCase.title;
        this.slug = testCase.slug;
        this.description = testCase.description;
        this.status = testCase.status;
        this.harness = testCase.harness;
        this.entries = testCase.entries;
        this.env = testCase.env;
    }
    Object.defineProperty(TestCase.prototype, "title", {
        get: function () {
            return this._title;
        },
        set: function (title) {
            this._title = title;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "slug", {
        get: function () {
            return this._slug;
        },
        set: function (slug) {
            this._slug = slug;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "description", {
        get: function () {
            return this._description;
        },
        set: function (description) {
            this._description = description;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "status", {
        get: function () {
            return this._status;
        },
        set: function (status) {
            this._status = status;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "harness", {
        get: function () {
            return this._harness;
        },
        set: function (harness) {
            this._harness = harness;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(TestCase.prototype, "entries", {
        get: function () {
            return this._entries;
        },
        set: function (entries) {
            this._entries = entries;
        },
        enumerable: true,
        configurable: true
    });
    TestCase.prototype.addEntry = function (entry) {
        this._entries[entry.id] = entry;
    };
    TestCase.prototype.removeEntry = function (id) {
        delete this._entries[id];
    };
    Object.defineProperty(TestCase.prototype, "env", {
        get: function () {
            return this._env;
        },
        set: function (env) {
            this._env = env;
        },
        enumerable: true,
        configurable: true
    });
    TestCase.prototype.isReadyToRun = function () {
        return (Utils_1.Util.getObjLength(this.entries) >= 2);
    };
    TestCase.create = function (testCaseEntity) {
        return new TestCase(testCaseEntity);
    };
    TestCase.createEmptyEntity = function () {
        return {
            title: '',
            slug: Utils_1.Util.randomString(10),
            description: '',
            status: 'public',
            harness: {
                html: '',
                setUp: '',
                tearDown: ''
            },
            entries: [
                { id: 1, title: '', code: '' },
                { id: 2, title: '', code: '' }
            ]
        };
    };
    TestCase.createEntityFromDOMElement = function (id) {
        var $elem = document.getElementById(id);
        var result = formToObject($elem, { includeEmptyValuedElements: true });
        return result.testCase;
    };
    TestCase.createEmptyTestCaseEntry = function (id) {
        return {
            id: id,
            title: '',
            code: ''
        };
    };
    return TestCase;
}());
exports.TestCase = TestCase;
//# sourceMappingURL=TestCase.js.map
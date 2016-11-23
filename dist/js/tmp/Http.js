"use strict";
var Http = (function () {
    function Http() {
    }
    Http.fromStringToJSON = function (str) {
        return str ? JSON.parse(str) : {};
    };
    Http.fromJSONToString = function (jsonObj) {
        return JSON.stringify(jsonObj);
    };
    Http.contentTypeIsJSON = function (header) {
        if (!header) {
            return false;
        }
        return !!header.match(/application\/json/i);
    };
    Http.prototype.sendRequest = function (request) {
        var deferred = Q.defer();
        var xhr = typeof XMLHttpRequest !== 'undefined' ? new XMLHttpRequest() : null;
        xhr.open(request.getMethod(), request.getUrl(), true);
        (function (headers) {
            for (var i in headers) {
                if (headers.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, headers[i]);
                }
            }
        })(request.getHeaders());
        var _response = this._response;
        xhr.onload = function () {
            if (xhr.readyState === Http.XHR_DONE) {
                _response = new Response(xhr.status, xhr.response);
                if (Http.contentTypeIsJSON(this.getResponseHeader('content-type'))) {
                    _response.setBody(Http.fromStringToJSON(_response.getBodyRaw()));
                }
                if (xhr.status === Http.HTTP_SUCCESS || xhr.status === Http.HTTP_CREATED) {
                    deferred.resolve(_response);
                }
                else {
                    deferred.reject(_response);
                }
            }
        };
        if (request.getBody()) {
            xhr.send(request.getBody());
        }
        else {
            xhr.send();
        }
        return deferred.promise;
    };
    Object.defineProperty(Http.prototype, "request", {
        get: function () {
            return this._request;
        },
        set: function (request) {
            this._request = request;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Http.prototype, "response", {
        get: function () {
            return this._response;
        },
        set: function (response) {
            this._response = response;
        },
        enumerable: true,
        configurable: true
    });
    Http.prototype.send = function (method, url, body) {
        return this.sendRequest(new Request(method, url, null, body));
    };
    Http.prototype.getJSON = function (url) {
        return this.sendRequest(new Request('GET', url, { 'Content-Type': 'application/json', 'Accept': 'application/json' }, null)).then(function (response) {
            return response;
        });
    };
    ;
    Http.prototype.postJSON = function (url, body) {
        var bodyString = Http.fromJSONToString(body);
        return this.sendRequest(new Request('POST', url, { 'Content-Type': 'application/json', 'Accept': 'application/json' }, bodyString)).then(function (response) {
            return response;
        });
    };
    ;
    Http.prototype.getHTML = function (url) {
        return this.sendRequest(new Request('GET', url, { 'Content-Type': 'text/html', 'Accept': 'text/html' }, null));
    };
    ;
    Http.HTTP_SUCCESS = 200;
    Http.HTTP_CREATED = 201;
    Http.HTTP_NOT_FOUND = 404;
    Http.HTTP_BAD_REQUEST = 400;
    Http.XHR_UNSENT = 0;
    Http.XHR_OPENED = 1;
    Http.XHR_HEADERS_RECEIVED = 2;
    Http.XHR_LOADING = 3;
    Http.XHR_DONE = 4;
    return Http;
}());
exports.Http = Http;
var Request = (function () {
    function Request(method, url, headers, body) {
        this.method = method;
        this.url = url;
        this.headers = headers || {};
        this.body = body;
    }
    ;
    Request.prototype.getMethod = function () {
        return this.method;
    };
    ;
    Request.prototype.getUrl = function () {
        return this.url;
    };
    ;
    Request.prototype.getHeaders = function () {
        return this.headers;
    };
    ;
    Request.prototype.getBody = function () {
        return this.body;
    };
    ;
    return Request;
}());
var Response = (function () {
    function Response(status, body) {
        this.status = status;
        this.body = body;
        this.bodyRaw = body;
    }
    ;
    Response.prototype.setStatus = function (status) {
        this.status = status;
    };
    ;
    Response.prototype.getStatus = function () {
        return this.status;
    };
    ;
    Response.prototype.setBody = function (body) {
        this.body = body;
    };
    ;
    Response.prototype.getBody = function () {
        return this.body;
    };
    ;
    Response.prototype.getBodyRaw = function () {
        return this.bodyRaw;
    };
    return Response;
}());
//# sourceMappingURL=Http.js.map
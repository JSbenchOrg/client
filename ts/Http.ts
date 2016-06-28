import Promise = Q.Promise;
export class Http {
    protected _request: HttpRequestInterface;
    protected _response: HttpResponseInterface;

    // HTTP codes.
    public static HTTP_SUCCESS: number = 200;
    public static HTTP_CREATED: number = 201;
    public static HTTP_NOT_FOUND: number = 404;
    public static HTTP_BAD_REQUEST: number = 400;

    public static XHR_UNSENT: number = 0;
    public static XHR_OPENED: number = 1;
    public static XHR_HEADERS_RECEIVED: number = 2;
    public static XHR_LOADING: number = 3;
    public static XHR_DONE: number = 4;

    protected static fromStringToJSON(str: string): Object {
        return str ? JSON.parse(str) : {};
    }

    protected static fromJSONToString(jsonObj: Object): string {
        return JSON.stringify(jsonObj);
    }

    protected static contentTypeIsJSON(header: string): boolean {
        if (!header) { return false; }
        return !!header.match(/application\/json/i);
    }

    public sendRequest(request: HttpRequestInterface): Promise<HttpResponseInterface> {
        var deferred = Q.defer<HttpResponseInterface>();
        var xhr = typeof XMLHttpRequest !== 'undefined' ? new XMLHttpRequest() : null;
        xhr.open(request.getMethod(), request.getUrl(), true);

        (function(headers: HttpHeadersInterface) {
            for (var i in headers) {
                if (headers.hasOwnProperty(i)) {
                    xhr.setRequestHeader(i, headers[i]);
                }
            }
        })(request.getHeaders());

        var _response = this._response;
        xhr.onload = function() {
            if (xhr.readyState === Http.XHR_DONE) {
                _response = new Response(xhr.status, xhr.response);
                // Convert the response body to JSON.
                // Keep the raw body untouched.
                if (Http.contentTypeIsJSON(this.getResponseHeader('content-type'))) {
                    _response.setBody(Http.fromStringToJSON(_response.getBodyRaw()));
                }
                if (xhr.status === Http.HTTP_SUCCESS || xhr.status === Http.HTTP_CREATED) {
                    deferred.resolve(_response);
                } else {
                    deferred.reject(_response);
                }
            }
        };

        if (request.getBody()) {
            xhr.send(request.getBody());
        } else {
            xhr.send();
        }

        return deferred.promise;
    }

    public get request(): HttpRequestInterface {
        return this._request;
    }

    public set request(request: HttpRequestInterface) {
        this._request = request;
    }

    public get response(): HttpResponseInterface {
        return this._response;
    }

    public set response(response: HttpResponseInterface) {
        this._response = response;
    }

    public send(method: string, url: string, body: string) {
        return this.sendRequest(
            new Request(method, url, null, body)
        );
    }

    public getJSON(url: string): Promise<HttpResponseInterface> {
        return this.sendRequest(
            new Request('GET', url, {'Content-Type': 'application/json', 'Accept': 'application/json'}, null)
        ).then(function(response: HttpResponseInterface) {
            return response;
        });
    };

    public postJSON(url: string, body: Object): Promise<HttpResponseInterface> {
        var bodyString = Http.fromJSONToString(body);
        return this.sendRequest(
            new Request('POST', url, {'Content-Type': 'application/json', 'Accept': 'application/json'}, bodyString)
        ).then(function(response: HttpResponseInterface) {
            return response;
        });
    };

    public getHTML(url: string) {
        return this.sendRequest(
            new Request('GET', url, {'Content-Type': 'text/html', 'Accept': 'text/html'}, null)
        );
    };
}

class Request implements HttpRequestInterface {
    protected method: string;
    protected url: string;
    protected headers: HttpHeadersInterface;
    protected body: string;

    constructor(method: string, url: string, headers: HttpHeadersInterface, body: string) {
        this.method = method;
        this.url = url;
        this.headers = headers || {};
        this.body = body;
    };

    public getMethod(): string {
        return this.method;
    };

    public getUrl(): string {
        return this.url;
    };

    public getHeaders(): HttpHeadersInterface {
        return this.headers;
    };

    public getBody(): string {
        return this.body;
    };
}

interface HttpRequestInterface {
    getMethod(): string;
    getUrl(): string;
    getHeaders(): HttpHeadersInterface;
    getBody(): string | Object;
}

class Response implements HttpResponseInterface {
    protected status: number;
    protected body: string | Object;
    protected bodyRaw: string;

    constructor(status: number, body: string) {
        this.status = status;
        this.body = body;
        this.bodyRaw = body;
    };

    public setStatus(status: number) {
        this.status = status;
    };

    public getStatus(): number {
        return this.status;
    };

    public setBody(body: string | Object) {
        this.body = body;
    };

    public getBody(): string | Object {
        return this.body;
    };

    public getBodyRaw(): string {
        return this.bodyRaw;
    }
}

export interface HttpResponseInterface {
    getStatus(): number;
    setStatus(status: number): void;
    getBody(): string | Object;
    setBody(body: string | Object): void;
    getBodyRaw(): string;
}

interface HttpHeadersInterface {
    [key: string]: string;
}

import defer = Q.defer;
export class Router {
    protected routes: Route[] = [];

    public run(customPath?: string) {
        var deferred = Q.defer();

        var path: string = customPath ? customPath : window.location.pathname;
        var route = this.matchRoute(path);
        if (route) {
            deferred.resolve(route.action.apply(null, route.args));
        } else {
            deferred.reject(new Error('No valid route found.'));
        }

        return deferred.promise;
    }

    public addRoute(path: string, action: Function) {
        if (!path || !action) {
            return false;
        }

        this.routes.push({
            path: path,
            action: action
        });
    }

    /**
     * 1. GET /test/sdadaad12/totals/byStuff.json
     * 2. Try match with /test/{test}/totals/{filter}.json
     * 3.
     * var aa = "/test/sdadaad12/totals/byStuff.json".match(new RegExp("\/test\/([a-z0-9]+)\/totals\/([a-z0-9]+)\.json", 'i')); aa = aa.slice(1, aa.length);
    */
    protected matchRoute(path: string): RequestedRoute {
        var matchFound: Array<string>;
        var preparedPath: string;
        for (var i = 0; i < this.routes.length; i++) {
            preparedPath = `^${Router.preparePath(this.routes[i].path)}$`;
            matchFound = path.match(new RegExp(preparedPath, 'i'));
            if (matchFound) {
                var args = matchFound.slice(1, matchFound.length);
                return <RequestedRoute>{
                    path: this.routes[i].path,
                    action: this.routes[i].action,
                    args: args,
                    requestedPath: path
                };
            }
        }
    }

    protected static preparePath(path: string) {
        return path.replace(/{[a-z]+}/g, '([a-z0-9-]+)');
    }
}

interface Route {
    path: string;
    action: Function;
}

interface RequestedRoute extends Route {
    requestedPath: string;
    args: Array<string>;
}

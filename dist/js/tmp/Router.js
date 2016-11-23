"use strict";
var Router = (function () {
    function Router() {
        this.routes = [];
    }
    Router.prototype.run = function (customPath) {
        var deferred = Q.defer();
        var path = customPath ? customPath : window.location.pathname;
        var route = this.matchRoute(path);
        if (route) {
            deferred.resolve(route.action.apply(null, route.args));
        }
        else {
            deferred.reject(new Error('No valid route found.'));
        }
        return deferred.promise;
    };
    Router.prototype.addRoute = function (path, action) {
        if (!path || !action) {
            return false;
        }
        this.routes.push({
            path: path,
            action: action
        });
    };
    Router.prototype.matchRoute = function (path) {
        var matchFound;
        var preparedPath;
        for (var i = 0; i < this.routes.length; i++) {
            preparedPath = "^" + Router.preparePath(this.routes[i].path) + "$";
            matchFound = path.match(new RegExp(preparedPath, 'i'));
            if (matchFound) {
                var args = matchFound.slice(1, matchFound.length);
                return {
                    path: this.routes[i].path,
                    action: this.routes[i].action,
                    args: args,
                    requestedPath: path
                };
            }
        }
    };
    Router.preparePath = function (path) {
        return path.replace(/{[a-z]+}/g, '([a-z0-9-]+)');
    };
    return Router;
}());
exports.Router = Router;
//# sourceMappingURL=Router.js.map
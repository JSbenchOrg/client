var App = (function () {
    function App() {
    }
    App.prototype.registerHandlebarsHelpers = function () {
        Handlebars.registerHelper('if_eq', function (a, b, opts) {
            if (a == b) {
                return opts.fn(this);
            }
            else {
                return opts.inverse(this);
            }
        });
        Handlebars.registerHelper('timestamp', function () {
            return (new Date()).getTime();
        });
    };
    return App;
}());
//# sourceMappingURL=App.js.map
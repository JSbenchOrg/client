class App {
    public constructor() {
        this.registerHandlebarsHelpers();
    }

    protected registerHandlebarsHelpers() {
        Handlebars.registerHelper('if_eq', function(a, b, opts) {
            if(a == b) {
                return opts.fn(this);
            } else {
                return opts.inverse(this);
            }
        });

        Handlebars.registerHelper('timestamp', function() {
            return (new Date()).getTime();
        });
    }
}
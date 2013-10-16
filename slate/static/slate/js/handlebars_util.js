Slate.Handlebars = (function() {
    "use strict";
    var compiled_templates = {};

    function load_template(name) {
        if (!compiled_templates[name]) {
            var source = document.getElementById(name).innerHTML;
            var compiled = Handlebars.compile(source);
            compiled_templates[name] = compiled;
        }

        return compiled_templates[name];
    }

    return {
        load_template: load_template
    };

})();


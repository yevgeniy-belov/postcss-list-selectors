var postcss = require('postcss');
module.exports = postcss.plugin('postcss-list-selectors', function (opts) {

    var path = opts.path || 'selectors-list.json';

    return function (root) {

        var rulesList = [];

        root.walkRules(function (rule) {
            rulesList.push(rule.selector);
        });

        fs = require('fs');
        fs.writeFile(path, JSON.stringify(rulesList, null, 4));

    };
});

var postcss = require('postcss');
module.exports = postcss.plugin('postcss-list-selectors', function (options) {

    return function (root) {
        options = options || {};

        var rulesList = [];
        // root.walkAtRules(function(rule) {
        //     content = {};
        //     key = '@' +  rule.name;
        //     content = rule.nodes[0].selector;
        //     rulesList.push(key + ': {' + content + '}');
        // });
        root.walkRules(function (rule) {
            rulesList.push(rule.selector);
        });
        fs = require('fs');
        fs.writeFile('ugentest.json', JSON.stringify(rulesList, null, 4));

    };
});

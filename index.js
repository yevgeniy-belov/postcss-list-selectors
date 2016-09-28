require('es6-promise').polyfill();
var postcss = require('postcss');
var fs = require('fs');
var _ = require('lodash');

module.exports = postcss.plugin('postcss-list-selectors', function (opts) {

    var dest = opts.dest || '1.json';
    var rulesList = [];
    var layerName = '';
    var repeatingExample = 'missing';

    return function (root) {

        var ruleSelector = '';
        var bemType = '';
        var blockStatus = '';
        var blockState = '';
        var example = '';

        function recognizeState() {
            if (ruleSelector.includes('hover')) {
                blockState = 'hover';
            } else if (ruleSelector.includes('focus')) {
                blockState = 'focus';
            } else if (ruleSelector.includes('active')) {
                blockState = 'active';
            } else if (ruleSelector.includes('checked')) {
                blockState = 'checked';
            } else if (ruleSelector.includes('disabled')) {
                blockState = 'disabled';
            } else if (ruleSelector.includes('empty')) {
                blockState = 'empty';
            } else if (ruleSelector.includes('enabled')) {
                blockState = 'enabled';
            } else if (ruleSelector.includes('visited')) {
                blockState = 'visited';
            } else {
                blockState = '';
            }
        }
        function recognizeStatus() {
            if (ruleSelector !== '') {
                if (ruleSelector.includes('primary')) {
                    blockStatus = 'primary';
                } else if (ruleSelector.includes('secondary')) {
                    blockStatus = 'secondary';
                } else if (ruleSelector.includes('warning')) {
                    blockStatus = 'warning';
                } else if (ruleSelector.includes('error')) {
                    blockStatus = 'error';
                } else if (ruleSelector.includes('info')) {
                    blockStatus = 'info';
                } else {
                    blockStatus = '';
                }

            }
        }
        function recognizeModifierType(rs, arr) {
            if (rs !== '') {
                return _.some(arr, function (item) {
                    return rs.includes(item);
                });
            }
            return false;
        }
        function recognizeBemType() {
            if (ruleSelector.includes('--')) {
                bemType = 'modifier';
            } else if (ruleSelector.includes('__')) {
                bemType = 'element';
            } else {
                bemType = 'block';
            }
        }
        function findExample(blockDom) {
            if (blockDom) {
                if (blockDom.includes('example:')){
                    example = blockDom.replace('example: ', '');
                }
            }
        }
        function findRepeatingExample(blockDom) {
            if (blockDom) {
                if (blockDom.includes('startExample:')){
                    example = blockDom.replace('startExample: ', '');
                }
            }
        }

        root.each(function (container) {
            example = '';
            var ruleSet = {};
            if (container.text) {
                if (container.text.includes('layer:')) {
                    layerName = container.text.replace('layer: ', '');
                }
            }

            // Process comments
            if (container.type === 'comment') {
                if (container.text.includes('startExample:')) {
                    repeatingExample = container.text.replace('startExample: ', '');
                }
                if (container.text.includes('stopExample')) {
                    repeatingExample = '';
                }
            }

            // Process rules
            if (container.type === 'rule') {
                ruleSelector = container.selector;
                recognizeBemType();
                recognizeStatus();
                recognizeState();
                if (container.nodes[0]) {
                    findExample(container.nodes[0].text);
                };
                ruleSet.selector = ruleSelector;
                exampleClass = ruleSelector.replace(/\./g,' ');
                exampleClass = exampleClass.replace(/\:after/g,'');
                ruleSet.BEM = bemType;
                ruleSet.modifierType = recognizeModifierType(ruleSelector, ['xl', 'lg']) ? 'size' : '';
                ruleSet.modifierType = recognizeModifierType(ruleSelector, ['weak', 'strong']) ? 'intensity' : '';
                ruleSet.layer = layerName;
                ruleSet.status = blockStatus;
                ruleSet.state = blockState;
                ruleSet.example = example;
                if (example === '') {
                    ruleSet.example = repeatingExample.replace(/\exampleClass/g, exampleClass) || 'missing';
                }
                rulesList.push(ruleSet);
            }
        });
        fs.writeFile(dest, JSON.stringify(rulesList, null, 4));
        rulesList = [];
    };
});

require('es6-promise').polyfill();
var postcss = require('postcss');
var fs = require('fs');
var _ = require('lodash');
module.exports = postcss.plugin('postcss-list-selectors', function (opts) {
    var mainDest = opts.mainDest || 'selectors-list.json';
    var statsDest = opts.statsDest || 'stats.json';
    var stats = {};
    var layerName = '';
    var repeatingExample = 'missing';
    var documenting = false;
    wrapper = {}; //This is what will be exported to JSON
    rules = []; //List of rules
    layers = []; //Divisions sorted by growing specificity according to ITCSS
    categories = []; // Colors, typography, buttons, etc.
    tags = []; // List of used tags.
    return function (root) {
        var selectorsCount = 0;
        var elementsCount = 0;
        var objectsCount = 0;
        var materialsCount = 0;
        var componentsCount = 0;
        var ruleSelector = '';
        var blockName = '';
        var bemType = '';
        var blockStatus = '';
        var blockState = '';
        var example = '';
        var template = '';
        var autoTemplate = false;
        function findLayers() {
            root.each(function(container) {
                if (container.type === 'comment') {
                    if (container.text.includes('layer:'))
                        layers.push(container.text.replace('layer: ', ''))
                }
            });
        }
        function findCategories() {
            root.each(function(container) {
                if (container.type === 'comment') {
                    if (container.text.includes('category:'))
                        categories.push(container.text.replace('category: ', ''))
                }
            });
        }
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
        function defineBlockName(){
            if (blockState !== ''){
                blockName =  ruleSelector.replace('^:', '');
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
        function removeNotNestingOperators(selector){
            return selector.replace(' + ', '');
        }
        function removeDotes(selector){
            return selector.replace('.', '');
        }
        function splitSelectorToNodes(selector) {
            return removeNotNestingOperators(selector).split(' '); // Chains after " " select childs of chains before " ".
        }
        function splitSubSelectors(selector) {
            return selector.split(',');
        }
        function buildExample(selector) {
            var selectorSiblings = []; // List of siblings - selector's parts separated by " + ",
            selectorSiblings = selector.split(' + '); // Chains separated by " + " select siblings.
            var selectorNodes = []; // List of nested nodes - selector's parts separated by " ",
            selectorNodes = splitSelectorToNodes(selector);
            selectorNodes = selectorNodes.reverse(); // Patch solution for wrong nesting order
            templateOpenTag = '<div';
            templateClassAttribute = 'class=';
            templateContent = 'Content';
            templateCloseTag = '</div>';
            for (var i = 0; i < selectorNodes.length; i++) {
                template = templateOpenTag + ' ' + templateClassAttribute + '"' + selectorNodes[i] + '"' + '>' + template + templateCloseTag;
                template = removeDotes(template);
            }
            return template;
        };

        function collectRules(){
            var layer = {};
            var currentLayer = '';
            var currentCategory = '';
            root.each(function (container) {
                var ruleSet = {};
                // Process comments
                if (container.type === 'comment') {
                    if (container.text.includes('startExample:')) {
                        repeatingExample = container.text.replace('startExample:', '');
                    }
                    if (container.text.includes('stopExample')) {
                        repeatingExample = '';
                    }
                    if (container.text.includes('startDocs')) {
                        documenting = true;
                    }
                    if (container.text.includes('stopDocs')) {
                        documenting = false;
                    }
                    if (container.text.includes('layer:')) {
                        currentLayer = container.text.replace('layer: ', '');
                    }
                    if (container.text.includes('category:')) {
                        currentCategory = container.text.replace('category: ', '');
                    }
                    if (container.text.includes('stopCategory')) {
                        currentCategory = '';
                    }
                    if (container.text.includes('startAutoExample')) {
                        autoTemplate = true;
                    }
                    if (container.text.includes('stopAutoExample')) {
                        autoTemplate = false;
                    }
                }
                if (documenting) {
                    example = '';
                    // Process rules
                    if (container.type === 'rule') {
                        selectorsCount = selectorsCount + 1;
                        ruleSelector = container.selector;
                        recognizeBemType();
                        recognizeStatus();
                        recognizeState();
                        if (container.nodes[0]) {
                            findExample(container.nodes[0].text);
                        };
                        // ruleSet.subSelectors = splitSubSelectors(ruleSelector);
                        // ruleSet.chainsList = splitSelectorToNodes(ruleSelector);
                        ruleSet.selector = ruleSelector;
                        ruleSet.layer = currentLayer;
                        ruleSet.category = currentCategory;
                        ruleSet.blockName = blockName;
                        exampleClass = ruleSelector.replace(/\./g,' ');
                        exampleClass = exampleClass.replace(/\:before/g,'');
                        exampleClass = exampleClass.replace(/\:after/g,'');
                        ruleSet.BEM = bemType;
                        ruleSet.modifierType = recognizeModifierType(ruleSelector, ['xl', 'lg']) ? 'size' : '';
                        ruleSet.modifierType = recognizeModifierType(ruleSelector, ['weak', 'strong']) ? 'intensity' : '';
                        // ruleSet.status = blockStatus;
                        // ruleSet.state = blockState;
                        if (autoTemplate){
                            ruleSet.template = buildExample(ruleSelector);
                        }
                        ruleSet.example = example;
                        if (example === '') {
                            ruleSet.example = repeatingExample.replace(/\exampleClass/g, exampleClass) || 'missing';
                        }
                        rules.push(ruleSet);
                    }
                }
            });
            return rules;
        };

        findLayers();
        findCategories();

        wrapper.layers = layers;
        wrapper.categories = categories.sort();
        wrapper.rules = collectRules();

        fs.writeFile(mainDest, JSON.stringify(wrapper, null, 4));
        // fs.writeFile(statsDest, JSON.stringify(stats, null, 4));
        documenting = false;
        wrapper = {}; //This is what will be exported to JSON
        rules = []; //List of rules
        layers = []; //Divisions sorted by growing specificity according to ITCSS
        categories = []; // Colors, typography, buttons, etc.
        tags = []; // List of used tags.
        selectorsCount = 0;
        elementsCount = 0;
        objectsCount = 0;
        materialsCount = 0;
        componentsCount = 0;
    };
});

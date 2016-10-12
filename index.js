require('es6-promise').polyfill();
var postcss = require('postcss');
var fs = require('fs');
var _ = require('lodash');
var mainFunction = function(opts) {
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
    return function(root) {
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
        var autoExample = false;
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
        function defineBlockName() {
            if (blockState !== '') {
                blockName = ruleSelector.replace('^:', '');
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
                return _.some(arr, function(item) {
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
                if (blockDom.includes('example:')) {
                    example = blockDom.replace('example: ', '');
                }
            }
        }
        function findRepeatingExample(blockDom) {
            if (blockDom) {
                if (blockDom.includes('startExample:')) {
                    example = blockDom.replace('startExample: ', '');
                }
            }
        }
        function transformClassSelectorToHtmlNode(classSelector, childNode){
            classSelector = classSelector.replace('.', '');
            return '<div class=' + '"' + classSelector + '"' + '>' + childNode + '</div>';
        }
        function transformTypeSelectorToHtmlNode(typeSelector, childNode){
            return '<' + typeSelector + '>' + childNode + '</' + typeSelector + '>';
        }
        function transformTypeSelectorSequenceToHtmlNode(typeSelectorSequence, childNode){
            var sequenceChains = typeSelectorSequence.split('.');
            var typeSelector = sequenceChains[0];
            var classesList = sequenceChains.splice(1).join(' '); //
            openTag = '<' + typeSelector + '>';
            closeTag = '</' + typeSelector + '>';
            return openTag + ' ' + attribute + '"' + classesList + '"' + '>' + example + closeTag;
        }
        function splitMainSelector(mainSelector) {
            var s = mainSelector
            s = s.split(', .').join(',.');
            s = s.split(', ').join(',');
            return s.split(',');
        }
        function splitChainToSequences(chain) {
            var chain = chain;
            chain = chain.replace(/ \+ /g, '+'); // Remove spaces for correct split.
            chain = chain.replace(/ > /g, '>'); // Remove spaces for correct split.
            chain = chain.replace(/ ~ /g, '~'); // Remove spaces for correct split.
            console.log(chain);
            sequence = chain.split(/ |>|~|\+/); // Split chain to sequnces (separated by spaces).
            // console.log(sequence);
            return sequence;
        }
        function iterateChain(chain) {
            var example = '';
            var sequences = splitChainToSequences(chain).reverse();
            sequences.unshift('exampleContent');
            for (var i = 0; i < sequences.length; i++) {
                var sequence = sequences[i];
                var siblings = [];
                openTag = '<div';
                attribute = 'class=';
                closeTag = '</div>';
                if (sequence === 'exampleContent') {
                    openTag = '';
                    attribute = '';
                    closeTag = '';
                    example = 'test';
                } else {
                    if (sequence.includes('+')) {
                        siblings = sequence.split('+');
                        for (var i = 0; i < siblings.length; i++) {
                            sibling = siblings[i];
                        }
                    } else
                    if (sequence.substring(0, 1) !== '.') {
                        if (sequence.includes('.')) {
                            example = transformTypeSelectorSequenceToHtmlNode(sequence, example);
                        } else example = transformTypeSelectorToHtmlNode(sequence, example);
                    } else example = transformClassSelectorToHtmlNode(sequence, example);
                }
            }
            return example;
        }
        function buildExample(mainSelector) {
            var examples = [];
            var mainChain = splitMainSelector(mainSelector); // List of selectors separated by ",".
            for (var i = 0; i < mainChain.length; i++) {
                examples.push(iterateChain(mainChain[i]));
            }
            return examples;
        }
        function collectRules() {
            var layer = {};
            var currentLayer = '';
            var currentCategory = '';
            root.each(function(container) {
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
                        autoExample = true;
                    }
                    if (container.text.includes('stopAutoExample')) {
                        autoExample = false;
                    }
                }
                if (documenting) {
                    example = '';
                    // Process rules
                    if (container.type === 'rule') {
                        selectorsCount = selectorsCount + 1;
                        ruleSelector = container.selector.replace(/(\r\n|\n|\r)/gm, ' ');
                        recognizeBemType();
                        recognizeStatus();
                        recognizeState();
                        if (container.nodes[0]) {
                            findExample(container.nodes[0].text);
                        };
                        // ruleSet.mainChain = splitMainSelector(ruleSelector);
                        ruleSet.selector = ruleSelector;
                        ruleSet.nodes = splitChainToSequences(ruleSelector);
                        // ruleSet.layer = currentLayer;
                        // ruleSet.category = currentCategory;
                        // ruleSet.blockName = blockName;
                        exampleClass = ruleSelector.replace(/\./g, ' ');
                        exampleClass = exampleClass.replace(/\:before/g, '');
                        exampleClass = exampleClass.replace(/\:after/g, '');
                        // ruleSet.BEM = bemType;
                        ruleSet.modifierType = recognizeModifierType(ruleSelector, ['xl', 'lg']) ? 'size' : '';
                        ruleSet.modifierType = recognizeModifierType(ruleSelector, ['weak', 'strong']) ? 'intensity' : '';
                        // ruleSet.status = blockStatus;
                        // ruleSet.state = blockState;

                        if (autoExample) {
                            ruleSet.examples = buildExample(ruleSelector);
                        }
                        // ruleSet.example = example;
                        // if (example === '') {
                        //     ruleSet.example = repeatingExample.replace(/\exampleClass/g, exampleClass) || 'missing';
                        // }
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


};
module.exports = postcss.plugin('postcss-list-selectors', mainFunction);

mainFunction({});

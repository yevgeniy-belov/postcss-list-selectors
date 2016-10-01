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
    layers = []; //Divisions sorted by growing specificity according to ITCSS
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
        function findLayers() {
            root.each(function(container) {
                if (container.type === 'comment') {
                    if (container.text.includes('layer:'))
                        layers.push(container.text.replace('layer: ', ''))
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
        function buildLayer(layerName){
            var layer = {};
            var layerContent = [];
            var currentLayerName = '';
            root.each(function (container) {
                var ruleSet = {};
                // Process comments
                if (container.type === 'comment') {
                    if (container.text.includes('startExample:')) {
                        repeatingExample = container.text.replace('startExample: ', '');
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
                }
                if (documenting) {
                    example = '';
                    if (container.text) {
                        if (container.text.includes('layer:')) {
                            currentlayerName = container.text.replace('layer: ', '');
                        }
                    }
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
                        ruleSet.selector = ruleSelector;
                        ruleSet.blockName = blockName;
                        exampleClass = ruleSelector.replace(/\./g,' ');
                        exampleClass = exampleClass.replace(/\:before/g,'');
                        exampleClass = exampleClass.replace(/\:after/g,'');
                        ruleSet.BEM = bemType;
                        ruleSet.modifierType = recognizeModifierType(ruleSelector, ['xl', 'lg']) ? 'size' : '';
                        ruleSet.modifierType = recognizeModifierType(ruleSelector, ['weak', 'strong']) ? 'intensity' : '';
                        ruleSet.status = blockStatus;
                        ruleSet.state = blockState;
                        ruleSet.example = example;
                        if (example === '') {
                            ruleSet.example = repeatingExample.replace(/\exampleClass/g, exampleClass) || 'missing';
                        }
                        if (layerName === currentlayerName){
                            layerContent.push(ruleSet);
                        }
                        layer = layerContent;
                    }
                }
            });
            return layer;
        };
        function fillLayers() {
            arrayLength = layers.length;
            for (var i = 0; i < arrayLength; i++) {
                wrapper[layers[i]] = (buildLayer(layers[i]));
            }
        }

        findLayers();
        fillLayers();

        fs.writeFile(mainDest, JSON.stringify(wrapper, null, 4));
        fs.writeFile(statsDest, JSON.stringify(stats, null, 4));
        documenting = false;
        var selectorsCount = 0;
        var elementsCount = 0;
        var objectsCount = 0;
        var materialsCount = 0;
        var componentsCount = 0;
    };
});

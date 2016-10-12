module.exports = function(grunt) {

    grunt.initConfig({

        postcss: {
            options: {
                processors: [
                    require('./index')({
                        mainDest: 'selectors-list.json'
                    })
                ]
            },
            dist: {
                src: 'css/input/3.css',
                // src: '../stylebox/docs/build/css/*.css',
                dest: 'build/output.css'
            }

        },
        watch: {
            main: {
                files: [
                    'css/input/*.css',
                    '../stylebox/src/less/**/*.less',
                    '*.js'
                ],
                tasks: ['postcss', 'copy'],
                options: {
                    spawn: true
                }
            }
        },
        copy: {
            main: {
                src: 'build/selectors-list.json',
                dest: 'build/',
                // dest: '../stylebox/docs/src/data/',
            }

        },
        'node-inspector': {
            dev: {}
        },
        bump: {
            options: {
                files: ['*.json'],
                commit: true,
                commitMessage: 'v%VERSION%',
                commitFiles: ['*'],
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: 'tag',
                pushTo: 'origin master',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d'
            }
        },
    });

    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-bump');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-node-inspector');

};

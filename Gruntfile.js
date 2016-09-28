module.exports = function(grunt) {

    grunt.initConfig({

        postcss: {
            options: {
                processors: [
                    require('./index')({
                        dest: 'selectors-list.json'
                    })
                ]
            },
            dist: {
                src: 'css/input/2.css',
                // src: '../stylebox/docs/build/css/*.css',
                dest: 'css/output/'
            }

        },
        watch: {
            scripts: {
                files: [
                    'css/input/*.css',
                    '*.js'
                ],
                tasks: ['postcss'],
                options: {
                    spawn: true
                }
            }
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

};

module.exports = function (grunt) {

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
        }
    });

    grunt.loadNpmTasks('grunt-postcss');
    grunt.loadNpmTasks('grunt-contrib-watch');

};

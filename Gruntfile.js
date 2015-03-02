module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        less: {
            min: {
                options: {
                    compress: true,
                    yuicompress: true,
                    optimization: 2
                },
                files: {
                    "dist/autocomplete.min.css": [
                        "src/autocomplete.less"
                    ]
                }
            },
            nomin: {
                files: {
                    "dist/autocomplete.css": [
                        "src/autocomplete.less"
                    ]
                }
            }
        },
        uglify: {
            options: {
                mangle: true,
                sourceMap: true,
                compress: true,
                preserveComments: false
            },
            dist: {
                files: {
                    'dist/autocomplete.min.js': [
                        'src/autocomplete.js',
                    ]
                }
            }
        },
        jshint: {
            source: [
                'src/autocomplete.js'
            ]
        }
    });

    grunt.registerTask('default', ["uglify", "less"]);
};
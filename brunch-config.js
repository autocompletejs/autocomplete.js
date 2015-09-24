'use strict';

exports.config = {
    paths: {
        'public': 'dist',
        'watched': [
            'src'
        ]
    },
    files: {
        stylesheets: {
            joinTo: {
                'autocomplete.css': /^src\/*.{css,less}/
            }
        },
        javascripts: {
            joinTo: {
                'autocomplete.js': /^src\/*.ts$/
            }
        },
    },
    plugins: {
        uglify: {
            mangle: true
        }
    }
};
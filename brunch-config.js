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
                'autocomplete.css': 'src/autocomplete.less'
            }
        },
        javascripts: {
            joinTo: {
                'autocomplete.js': 'src/autocomplete.ts'
            }
        },
    },
    plugins: {
        uglify: {
            mangle: true
        }
    }
};
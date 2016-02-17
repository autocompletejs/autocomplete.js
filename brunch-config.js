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
                'autocomplete.css': /^src/
            }
        },
        javascripts: {
            joinTo: {
                'autocomplete.js': /^src/
            }
        }
    },
    plugins: {
        brunchTypescript: {
            tscOption: "--removeComments"
        }
    }
};
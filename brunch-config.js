'use strict';

module.exports = {
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
    modules: false
};

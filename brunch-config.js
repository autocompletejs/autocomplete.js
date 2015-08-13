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
    overrides: {
        production: {
            optimize: true,
            sourceMaps: false,
            // plugins: {
            //     autoReload: {
            //         enabled: false
            //     }
            // }
        }
    },
    plugins: {
        uglify: {
            mangle: {
                toplevel: true,
                eval: true,
                functions: true
            },
            compress: {
                global_defs: {
                    DEBUG: false
                }
            }
        }
    }
};
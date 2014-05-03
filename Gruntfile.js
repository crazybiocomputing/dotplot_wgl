/* jshint node: true */
"use strict";

module.exports = function(grunt) {
    require("time-grunt")(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            begin: ["dist/<%= pkg.version %>/"],
            end: [
                "dist/<%= pkg.version %>/**/*.css",
                "!**/*.min.css",
                "dist/<%= pkg.version %>/**/*.js",
                "!**/*.min.js"
            ]
        },
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: "src",
                        src: ["**/*", "!**/*.cs?"],
                        dest: "dist/<%= pkg.version %>/"
                    }
                ]
            }
        },
        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today('yyyy-mm-dd') %> */\n<%= pkg.license %>\n",
                //sourceMap: true,
                report: "gzip"
            },
            core: {
                src: [
                    "dist/<%= pkg.version %>/core/interface.js",
                    "dist/<%= pkg.version %>/core/viewer.js",
                    "dist/<%= pkg.version %>/core/sequences.js",
                    "dist/<%= pkg.version %>/core/matrices.js",
                    "dist/<%= pkg.version %>/core/main.js"
                ],
                dest: "dist/<%= pkg.version %>/core/<%= pkg.name %>.min.js"
            },
            firstLoad: {
                src: "dist/<%= pkg.version %>/core/firstLoad.js",
                dest: "dist/<%= pkg.version %>/core/firstLoad.min.js"
            },
            workers: {
                expand: true,
                src: "dist/<%= pkg.version %>/core/workers/*.js",
                dest: ".",
                ext: ".min.js"
            }
        },
        autoprefixer: {
            options: {
                browsers: ["last 2 versions", "Firefox >= 3.5", "Chrome >= 4", "Safari >= 4", "Opera >= 10.6", "Explorer >= 10", "iOS >= 5"]
            },
            build: {
                expand: true,
                flatten: true,
                src: ["src/stylesheets/*.css"],
                dest: "dist/<%= pkg.version %>/stylesheets/"
            }
        },
        cssmin: {
            options: {
                banner: "/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today('yyyy-mm-dd') %> */\n<%= pkg.license %>",
                report: "gzip"
            },
            build: {
                expand: true,
                src: ["dist/<%= pkg.version %>/stylesheets/*.css"],
                dest: ".",
                ext: ".min.css"
            }
        },
        replace: {
            html: {
                src: ["dist/<%= pkg.version %>/index.html"],
                overwrite: true,
                replacements: [
                    {from: /href='(.*).css'/g, to: "href='$1.min.css'"},
                    {from: /\n    <script.*><\/script>/g, to: ""},
                    {from: /(<\/head>)/g, to: "    <script src='core/<%= pkg.name %>.min.js' async></script>\n$1"},
                    {from: /\{\{name\}\}/g, to: "<%= pkg.name %>"},
                    {from: /\{\{description\}\}/g, to: "<%= pkg.description %>"},
                    {from: /\{\{version\}\}/g, to: "<%= pkg.version %>"},
                ]
            },
            js: {
                src: ["dist/<%= pkg.version %>/core/*.js"],
                overwrite: true,
                replacements: [
                    {from: /(".*).js/g, to: "$1.min.js"}
                ]
            },
            webapp: {
                src: ["dist/<%= pkg.version %>/manifest.webapp"],
                overwrite: true,
                replacements: [
                    {from: /\{\{version\}\}/g, to: "<%= pkg.version %>"},
                    {from: /\{\{name\}\}/g, to: "<%= pkg.name %>"},
                    {from: /\{\{description\}\}/g, to: "<%= pkg.description %>"}
                ]
            },
            appcache : {
                src: ["dist/<%= pkg.version %>/manifest.appcache"],
                overwrite: true,
                replacements: [
                    {from: /\n.*\.map/g, to: ""},
                    {from: /\n[^\.\n]*\.js/g, to:""},
                    {from: /\nmanifest.webapp/g, to:""}
                ]
            }
        },
        appcache: {
            options: {
                basePath: "dist/<%= pkg.version %>"
            },
            build: {
                dest: "dist/<%= pkg.version %>/manifest.appcache",
                cache: "dist/<%= pkg.version %>/**/*",
                network: "*"
            }
        },
        jsdoc: {
            dist: {
                src: ["src/core/**/*.js"],
                options: {
                    destination: "dist/<%= pkg.version %>/doc"
                }
            }
        }
    });

    require("load-grunt-tasks")(grunt);

    grunt.registerTask("default", ["clean:begin", "copy", "replace:html", "replace:js", "uglify", "autoprefixer", "cssmin", "clean:end", "appcache", "replace:appcache", "replace:webapp", "jsdoc"]);
};

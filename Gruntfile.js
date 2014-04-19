/* jshint node: true */
"use strict";

module.exports = function(grunt) {
    require("time-grunt")(grunt);
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),
        clean: {
            begin: ["dist/<%= pkg.version %>/"],
            end: ["dist/<%= pkg.version %>/**/*.css", "!**/*.min.css"]
        },
        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: "src",
                        src: ["**/*.html", "**/*.js", "**/*.texture", "**/*.vs", "**/*.fs"],
                        dest: "dist/<%= pkg.version %>/"
                    }
                ]
            }
        },
        uglify: {
            options: {
                banner: "/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today('yyyy-mm-dd') %> */\n<%= pkg.license %>",
                sourceMap: true,
                report: "gzip"
            },
            core: {
                src: ["dist/<%= pkg.version %>/core/*.js", "!dist/<%= pkg.version %>/core/firstLoad.js"],
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
                    {from: /(<\/head>)/g, to: "    <script src='core/<%= pkg.name %>.min.js' async></script>\n$1"}
                ]
            },
            js: {
                src: ["dist/<%= pkg.version %>/core/*.js"],
                overwrite: true,
                replacements: [{from: /(".*).js/g, to: "$1.min.js"}]
            },
            appcache : {
                src: ["dist/<%= pkg.version %>/manifest.appcache"],
                overwrite: true,
                replacements: [
                    {from: /\n.*\.map/g, to: ""},
                    {from: /\n[^\.\n]*\.js/g, to:""}
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
        }
    });

    require("load-grunt-tasks")(grunt);

    grunt.registerTask("default", ["clean:begin", "copy", "replace:html", "replace:js", "uglify", "autoprefixer", "cssmin", "clean:end", "appcache", "replace:appcache"]);
};

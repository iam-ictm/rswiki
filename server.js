/*

TODOs
=====
* unit-testing (travis?)
* authentication
* minify

Features
========
* Direkteingabe von HTML, Turtle
* Komplett statischer Export

*/

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:4, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, regexp:true, undef:true, unused: true, trailing:true */
/*global DOCUMENT:true, HTML:true, HEAD:true, BODY:true, META:true, TITLE:true, LINK:true, SCRIPT:true, A:true, TEXTAREA:true, DIV:true */


/***********************************************************
 Initialisation
 **********************************************************/

'use strict';

// TODO: make configurable
var DEBUG = true;
var LISTENPORT = 8080;
var WIKIDATA = '/tmp/wikidata';
var PAGEPREFIX = '/page';
var CLIENTRESOURCES = {director: '/node_modules/director/build/director.min.js',
                        jquery: '/lib/jquery-1.9.0.js',
                        md_converter: '/node_modules/pagedown/Markdown.Converter.js',
                        md_sanitizer: '/node_modules/pagedown/Markdown.Sanitizer.js',
                        md_editor: '/lib/wmd-editor/Markdown.Editor.js',
                        md_styles: '/lib/wmd-editor/wmd-styles.css'};

require('domo').global();

var http = require('http'),
    filesystem = require('fs'),
    url = require('url'),
    pagedown = require('pagedown'),
    mime = require('mime'),
    director = require('director'),
    io = require('socket.io');


/***********************************************************
 Function definitions
 **********************************************************/

function send404(response) {
    if (DEBUG) {
        console.log('ERROR: 404 Not found!');
    }

    response.writeHead(404, {
        'Content-Type': 'text/plain;charset="utf-8"'
    });
    response.write('404 Not found!\n');
    response.end();
}

function editorScript() {
    return 'var socket = io.connect("http://localhost:8080");\n\n' +

            'var edit = function () {\n' +
            'HERE\n' + // TODO
            '    $("#wikicontent").hide();\n' +
            '    $("#wikieditor").append(\'' +
                DIV(
                DIV({'class': 'wmd-panel'},
                    DIV({id: 'wmd-button-bar'}),
                    TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}, '%#%MARKDOWN%#%'),
                    DIV(
                        A({href: '#/save'}, 'Save'), ' | ',
                        A({href: '#/cancel'}, 'Cancel'))
                ),
                DIV({id: 'wmd-preview', 'class': 'wmd-panel wmd-preview'})) +
            '\');\n' +

            '    var converter = Markdown.getSanitizingConverter()\n' +
            '    var editor = new Markdown.Editor(converter);\n' +
            '    editor.run();\n' +
            '};\n\n' +

            'var save = function () {\n' +
            '    $("#wikieditor").empty();\n' +
            '    $("#wikicontent").show();\n' +
            '};\n\n' +

            'var cancel = function () {\n' +
            '    socket.emit("cancel", { my: "data" });\n' +
            '    $("#wikieditor").empty();\n' +
            '    $("#wikicontent").show();\n' +
            '};\n\n' +

            'var routes = {\n' +
            '    \'/edit\': edit,\n' +
            '    \'/save\': save,\n' +
            '    \'/cancel\': cancel\n' +
            '};\n\n' +

            'var router = Router(routes);\n' +
            'router.init();\n';
}

function loadWikiPage(name, callback) {
    var filename = WIKIDATA + '/' + name + '.md';

    if (DEBUG) {
        console.log('Loading page "' + filename + '"...');
    }

    filesystem.exists(filename, function (exists) {
        if (!exists) {
            if (DEBUG) {
                console.log('ERROR: Page "' + name + '" does not exist!');
            }
            callback(true, [0, 'Page "' + name + '" does not exist!']);
            return;
        }

        filesystem.readFile(filename, 'utf8', function (err, file) {
            if (err) {
                if (DEBUG) {
                    console.log('ERROR: Error occured while loading page: ' + err);
                }
                callback(true, [1, 'Error occured while loading page!', err]);
                return;
            }

            callback(false, file);
        });
    });
}

function getFile(prefix, path) {
    var filename = prefix + '/' + path;    // TODO workaround for not working regexp in director/route...

    if (DEBUG) {
        console.log('Routed into getFile("' + filename + '")');
    }

    var that = this;
    filesystem.exists(filename, function (exists) {
        if (!exists) {
            send404(that.res);
            return;
        }

        filesystem.readFile(filename, 'binary', function (err, file) {
            if (err) {
                if (DEBUG) {
                    console.log('ERROR: Error occured reading file: ' + err);
                }

                that.res.writeHead(500, {
                    'Content-Type': 'text/plain;charset="utf-8"'
                });
                that.res.write(err + '\n');
                that.res.end();
                return;
            }

            var type = mime.lookup(filename);
            that.res.writeHead(200, {
                'Content-Type': type
            });
            that.res.write(file, 'binary');
            that.res.end();
        });
    });
}

function getPage() {
    if (DEBUG) {
        console.log('Routed into getPage()');
    }

    var page = url.parse(this.req.url).pathname.replace(PAGEPREFIX + '/', '');
    var that = this;

    loadWikiPage(page, function (err, markdown) {
        var pagecontent = '';

        if (err) {
            pagecontent = '<div id="errormessage">' + markdown[1] + '</div>';
        }
        else {
            pagecontent = pagedown.getSanitizingConverter().makeHtml(markdown); // or: new pagedown.Converter();
        }

        that.res.writeHead(200, {'Content-Type': 'text/html'});
        that.res.end(
            DOCUMENT(
                HTML({lang: 'en'},
                    HEAD(
                        META({charset: 'utf-8'}),
                        TITLE('Wiki'),
                        LINK({rel: 'stylesheet', type: 'text/css', href: CLIENTRESOURCES.md_styles}),
                        SCRIPT({src: CLIENTRESOURCES.jquery}),
                        SCRIPT({src: CLIENTRESOURCES.director}),
                        SCRIPT({src: CLIENTRESOURCES.md_converter}),
                        SCRIPT({src: CLIENTRESOURCES.md_sanitizer}),
                        SCRIPT({src: CLIENTRESOURCES.md_editor}),
                        SCRIPT({src: '/socket.io/socket.io.js'}),
                        SCRIPT(editorScript())
                    ),
                    BODY(
                        DIV({id: 'header'},
                            DIV({id: 'title'}, 'Wiki...'),
                            DIV({id: 'navi'},
                                A({href: '#/edit'}, 'Edit page')
                            )
                        ),
                        DIV({id: 'wikieditor'}),
                        DIV({id: 'wikicontent'}, '%#%PAGECONTENT%#%')
                    )
                )
            ).outerHTML.replace('%#%PAGECONTENT%#%', pagecontent).replace('%#%MARKDOWN%#%', markdown.replace(/\n/g, '\\n'))
        );
    });
}


/***********************************************************
 Main application
 **********************************************************/

var route = {
    '/(lib)/(.*)': {
        get:  getFile
    },
    '/(node_modules)/(.*)': {
        get:  getFile
    },
    PAGEPREFIX: {
        '/(.+)': {
            get: getPage
        }
    },
    '/': {
        get: function () {
            if (DEBUG) {
                console.log('Redirecting to /page/main...');
            }

            this.res.writeHead(301, {'Location': '/page/main'});
            this.res.end();
        }
    }
};

var router = new director.http.Router(route);

var server = http.createServer(function (req, res) {
    if (DEBUG) {
        console.log('New request for URL ' + req.url);
    }

    router.dispatch(req, res, function (err) {
        if (err) {
            send404(res);
        }
    });
});

var ioListener = io.listen(server);
server.listen(LISTENPORT);

ioListener.sockets.on('connection', function (socket) {
    socket.emit('news', { hello: 'world' });
    socket.on('cancel', function (data) {
        console.log('CANCEL: ' + data);
    });
});

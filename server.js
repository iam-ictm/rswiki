/*
Projectname: castanea

TODOs
=====
* unit-testing (travis?)
* jshint/lint

Features
========
* Direkteingabe von HTML, Turtle
* Komplett statischer Export

*/


/***********************************************************
 Initialisation
 **********************************************************/

'use strict';

var DEBUG = true;   // TODO: make configurable
var LISTEN_PORT = 8080;  // TODO: make configurable

require('domo').global(); 

var http = require('http'),
    pagedown = require('pagedown'),
	filesystem = require('fs'),
	mime = require('mime'),
    director = require('director');


/***********************************************************
 Function definitions
 **********************************************************/

function send404(response) {
        DEBUG && console.log('404 Not found!');

        response.writeHead(404, {
            'Content-Type': 'text/plain;charset="utf-8"'
        });
        response.write('404 Not found!\n');
        response.end();
}

function editorScript() {
    return '\nvar edit = function () {\n' +
           '    $("#wikieditor").append(\'' +
                DIV(
                DIV({'class': 'wmd-panel'},
                    DIV({id: 'wmd-button-bar'}),
                    TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}),
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
           '};\n\n' + 

           'var cancel = function () {\n' + 
           '    $("#wikieditor").empty();\n' + 
           '};\n\n' + 

           'var routes = {\n' +
           '    \'/edit\': edit,\n' +
           '    \'/save\': save,\n' +
           '    \'/cancel\': cancel\n' +
           '};\n\n' +

           'var router = Router(routes);\n' +
           'router.init();\n';
}

function getFile(prefix, path) {
    var filename = prefix + '/' + path;    // TODO workaround for not working regexp in director/route...

    DEBUG && console.log('Routed into getFile("' + filename + '")');

    var that = this;
    filesystem.exists(filename, function (exists) {
        if (!exists) {
            send404(that.res);
            return;
        }

        filesystem.readFile(filename, 'binary', function (err, file) {
            if (err) {
                DEBUG && console.log('Error reading file: ' + err);

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
    DEBUG && console.log('Routed into getPage()');

    var converter = pagedown.getSanitizingConverter(); // or: new pagedown.Converter();
    var output = converter.makeHtml('*Hello World*');

    this.res.writeHead(200, {'Content-Type': 'text/html'})
    this.res.end(

    DOCUMENT(
        HTML({lang: 'en'},
            HEAD(
                META({charset: 'utf-8'}),
                TITLE('Wiki'),
                LINK({rel: 'stylesheet', type: 'text/css', href: '/lib/wmd-editor/wmd-styles.css'}),
                SCRIPT({src: '/lib/jquery-1.9.0.js'}),
                SCRIPT({src: '/node_modules/director/build/director.min.js'}),
                SCRIPT({src: '/node_modules/pagedown/Markdown.Converter.js'}),
                SCRIPT({src: '/node_modules/pagedown/Markdown.Sanitizer.js'}),
                SCRIPT({src: '/lib/wmd-editor/Markdown.Editor.js'}),
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
                DIV({id: 'wikicontent'}, '%#%MARKDOWN%#%')
            )
        )
    ).outerHTML.replace('%#%MARKDOWN%#%',output)

  )
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
    '/page': {
        '/(.+)': {
            get: getPage
        }
    },
    '/': {
        get: function() { 
            DEBUG && console.log('Redirecting to /page/main...');

            this.res.writeHead(301, {'Location': '/page/main'});
            this.res.end();
        }
    }
};

var router = new director.http.Router(route);

var server = http.createServer(function(req, res) {
    DEBUG && console.log('New request for URL ' + req.url);

    router.dispatch(req, res, function(err) {
        if (err) {
            send404(res);
        }
    });
});

server.listen(LISTEN_PORT);

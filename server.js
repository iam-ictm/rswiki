/*

TODOs
=====
* TODO unit-testing (travis?)
* TODO authentication (webid?)
* TODO propper logging
* TODO buildprocess including minimizing, linting, tag-generation
* TODO synchronize writes/reads?
* TODO use AJAX instead of websockets?

Features
========
* Direkteingabe von HTML, Turtle
* Komplett statischer Export

*/

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, regexp:true, undef:true, unused: true, trailing:true */
/*global DOCUMENT:true, HTML:true, HEAD:true, BODY:true, META:true, TITLE:true, LINK:true, SCRIPT:true, A:true, DIV:true */


/***********************************************************
 Initialisation
 **********************************************************/

'use strict';

// TODO: make configurable
var DEBUG = true;
var LISTENPORT = 8080;
var WIKIDATA = '/tmp/wikidata';
var PAGEPREFIX = '/page';
var CLIENTRESOURCES = {domo: '/node_modules/domo/lib/domo.js',
                        director: '/node_modules/director/build/director.min.js',
                        md_converter: '/node_modules/pagedown/Markdown.Converter.js',
                        md_sanitizer: '/node_modules/pagedown/Markdown.Sanitizer.js',
                        md_editor: '/lib/wmd-editor/Markdown.Editor.js',
                        md_styles: '/lib/wmd-editor/wmd-styles.css',
                        jquery: '/lib/jquery-1.9.0.js',
                        wikifunctions: '/static/wikifunctions.js'};

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

function loadWikiPage(name, callback) {
  var filename = WIKIDATA + '/' + name + '.md';

  if (DEBUG) {
    console.log('Loading page "' + filename + '"...');
  }

  filesystem.exists(filename, function (exists) {
    if (!exists) {
      // not existing is not an error, returning a marker to indicate that...

      if (DEBUG) {
        console.log('Page does not exist, returning NEWPAGE-marker...');
      }

      callback(false, '%#%NEWPAGE%#%');
      return;
    }

    filesystem.readFile(filename, 'utf8', function (err, file) {
      if (err) {
        if (DEBUG) {
          console.log('ERROR: Error occured while loading page: ' + err);
        }
        callback(true, 'Error occured while loading page : ' + err);
        return;
      }

      callback(false, file);
    });
  });
}

function saveWikiPage(data, callback) {
  // TODO implement deleting of page...
  var filename = WIKIDATA + '/' + data.pagename + '.md';

  if (DEBUG) {
    console.log('Saving page "' + filename + '"...');
  }
  
  filesystem.writeFile(filename, data.markdown, 'utf8', function (err) {
    if (err) {
      if (DEBUG) {
        console.log('ERROR: Error occured while saving page: ' + err);
      }
      callback(true, 'Error occured while saving page : ' + err);
      return;
    }
  });

  loadWikiPage(data.pagename, callback);
}

function getFile(prefix, path) {
  var filename = prefix + '/' + path;  // TODO workaround for not working regexp in director/route...

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
      pagecontent = '<div id="errormessage">' + markdown + '</div>';
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
            SCRIPT({src: CLIENTRESOURCES.domo}),
            SCRIPT({src: CLIENTRESOURCES.director}),
            SCRIPT({src: CLIENTRESOURCES.md_converter}),
            SCRIPT({src: CLIENTRESOURCES.md_sanitizer}),
            SCRIPT({src: CLIENTRESOURCES.md_editor}),
            SCRIPT({src: '/socket.io/socket.io.js'}),
            SCRIPT({src: CLIENTRESOURCES.jquery}),
            SCRIPT({src: CLIENTRESOURCES.wikifunctions})
          ),
          BODY(
            DIV({id: 'header'},
              DIV({id: 'title'}, 'Wiki...'),
              DIV({id: 'navi'},
                A({id: 'editlink', href: '#/edit'}, 'Edit ' + page)
              )
            ),
            DIV({id: 'wikieditor'}),
            DIV({id: 'wikicontent'}, '%#%PAGECONTENT%#%')
          )
        )
      ).outerHTML.replace('%#%PAGECONTENT%#%', pagecontent)
    );
  });
}


/***********************************************************
 Main application
 **********************************************************/

var route = {
  '/(static)/(.*)': {
    get:  getFile
  },
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

var ioListener = io.listen(server, {log: false});
server.listen(LISTENPORT);

ioListener.sockets.on('connection', function (socket) {
  // anonymous functions for socket.io-events. TODO maybe use events instead of CSP?

  // editPrepare-event
  socket.on('editPrepare', function (data) {    // TODO check params, especially pagename
    if (DEBUG) {
      console.log('Received io event editPrepare for page "' + data.pagename + '".');
    }
    loadWikiPage(data.pagename, function (err, markdown) {
      if (err) {
        if (DEBUG) {
          console.log('Emitting error, error occured: ' + markdown);
        }
        socket.emit('error', {pagename: data.pagename, error: markdown});
      }
      else {
        if (DEBUG) {
          console.log('Emitting editStart, sending markdown...');
        }
        socket.emit('editStart',  {pagename: data.pagename, pagecontent: markdown});
      }
    });
  });

  // save-event
  socket.on('save', function (data) {    // TODO check params, especially pagename
    if (DEBUG) {
      console.log('Received io event save for page "' + data.pagename + '".');
    }
    saveWikiPage(data, function (err, markdown) {
      if (err) {
        if (DEBUG) {
          console.log('Emitting error, error occured: ' + markdown);
        }
        socket.emit('error', {pagename: data.pagename, error: markdown});
      }
      else {
        if (DEBUG) {
          console.log('Emitting pageSaved, sending markdown...');
        }
        socket.emit('pageSaved',  {pagename: data.pagename, pagecontent: markdown});
      }
    });
  });
});

/*
 * TODO license/copyright
 */

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, regexp:true, undef:true, unused: true, trailing:true */
/*global DOCUMENT:true, HTML:true, HEAD:true, BODY:true, META:true, TITLE:true, LINK:true, SCRIPT:true, A:true, DIV:true SPAN:true */


/***********************************************************
 * Initialisation
 **********************************************************/

'use strict';

// TODO: make options configurable
var DEBUG = true;  // TODO use better logging-system
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
  io = require('socket.io'),
  git = require('gitty');


/***********************************************************
 * Function definitions
 **********************************************************/

//////////////////// helper-functions

/*
 * Helper for handling callbacks of repo.*
 * Properly inform user via callback and return true/false for continuing or
 * aborting the CSP.
 */
function gitSuccess(err, callback) {
  if (err) {
    if (DEBUG) {
      console.log('ERROR: git error: ' + err);
    }

    if (callback) {
      callback(true, 'Error occured while saving page : ' + err);
    }

    return false;
  } else {
    return true;
  }
}


/*
 * Loads the contents of a wikipage (in markdown) from WIKIDATA
 */
function loadWikiPage(name, callback) {
  var filename = WIKIDATA + '/' + name + '.md';

  if (DEBUG) {
    console.log('Loading page "' + filename + '"...');
  }

  filesystem.exists(filename, function (exists) {
    if (exists) {
      filesystem.readFile(filename, 'utf8', function (err, file) {
        if (err) {
          if (DEBUG) {
            console.log('ERROR: Error occured while loading page: ' + err);
          }
          callback(true, 'Error occured while loading page : ' + err);
        } else {
          callback(false, file);
        }
      });
    } else {
      // not existing is not an error, returning a marker to indicate that...

      if (DEBUG) {
        console.log('Page does not exist, returning NEWPAGE-marker...');
      }
      callback(false, '%#%NEWPAGE%#%');
    }
  });
}

/*
 * Saves the contents (markdown) of a wikipage to WIKIDATA and commits it
 * in git.
 */
function saveWikiPage(data, callback) {
  var filename = WIKIDATA + '/' + data.pagename + '.md';

  if (DEBUG) {
    console.log('Saving page "' + filename + '"...');
  }

  // TODO synchronize the whole thing somehow?
  filesystem.writeFile(filename, data.markdown, 'utf8', function (err) {
    if (err) {
      if (DEBUG) {
        console.log('ERROR: Error occured while saving page: ' + err);
      }
      callback(true, 'Error occured while saving page : ' + err);
    } else {
      var repo = new git.Repository(WIKIDATA);
      var gitfiles = [data.pagename + '.md'];

      git.config('user.name', data.user.name, function (err) {
        if (gitSuccess(err, callback)) {
          git.config('user.email', data.user.email, function (err) {
            if (gitSuccess(err, callback)) {
              repo.add(gitfiles, function (err) {
                if (gitSuccess(err, callback)) {
                  repo.commit(data.changemessage, function (err) {
                    if (gitSuccess(err, callback)) {
                      if (DEBUG) {
                        console.log('Successfully committed page "' + data.pagename + '"!');
                      }
                    } else {
                      gitSuccess('repo.commit failed', null);
                      repo.unstage(gitfiles, gitSuccess);
                    }
                  });
                } else {
                  gitSuccess('repo.add failed', null);
                  repo.unstage(gitfiles, gitSuccess);
                }
              });
            }
          });
        }
      });
    }
  });

  loadWikiPage(data.pagename, callback);    // reload page from storage and give it back to caller
}

/*
 * Loads the contents of a wikipage (in markdown) from WIKIDATA
 */
function deleteWikiPage(data, callback) {
  var filename = WIKIDATA + '/' + data.pagename + '.md';
  var repo = new git.Repository(WIKIDATA);
  var gitfiles = [data.pagename + '.md'];

  if (DEBUG) {
    console.log('Deleting page "' + data.pagename + '"...');
  }

  git.config('user.name', data.user.name, function (err) {
    if (gitSuccess(err, callback)) {
      git.config('user.email', data.user.email, function (err) {
        if (gitSuccess(err, callback)) {
          repo.remove(gitfiles, function (err) {
            if (gitSuccess(err, callback)) {
              repo.commit(data.changemessage, function (err) {
                if (gitSuccess(err, callback)) {
                  filesystem.unlink(filename, function (err) {
                    if (err) {
                      if (DEBUG) {
                        console.log('ERROR while deleting page: ' + err);
                        callback(true, err);
                      }
                    } else {
                      if (DEBUG) {
                        console.log('Successfully deleted page "' + data.pagename + '"!');
                        callback(false, null);
                      }
                    }
                  });
                } else {
                  gitSuccess('repo.commit failed', null);
                }
              });
            } else {
              gitSuccess('repo.remove failed', null);
            }
          });
        }
      });
    }
  });
}

/*
 * Send a proper 404-response...
 */
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


//////////////////// functions for router

/*
 * Reads a file from the filesystem and sends it to the client, setting
 * content-type as determined by mime.lookup()
 */
function rtr_getFile(prefix, path) {
  var that = this;
  var filename = prefix + '/' + path;  // TODO workaround for not working regexp in director/route...

  if (DEBUG) {
    console.log('Routed into rtr_getFile("' + filename + '")');
  }

  filesystem.exists(filename, function (exists) {
    if (exists) {
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
        } else {
          var type = mime.lookup(filename);
          that.res.writeHead(200, {
            'Content-Type': type
          });
          that.res.write(file, 'binary');
          that.res.end();
        }
      });
    } else {
      send404(that.res);
    }
  });
}

/*
 * Creates the markup for a wikipage and fills it with the current content of
 * the specified page in WIKIDATA.
 */
function rtr_getPage() {
  var that = this;
  var page = url.parse(this.req.url).pathname.replace(PAGEPREFIX + '/', '');

  if (DEBUG) {
    console.log('Routed into rtr_getPage()');
  }

  loadWikiPage(page, function (err, data) {
    var pagecontent = '';

    if (err) {
      pagecontent = '<div id="wikierror">' + data + '</div>';
    } else {
      pagecontent = pagedown.getSanitizingConverter().makeHtml(data); // or: new pagedown.Converter();
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
            SCRIPT({src: '/socket.io/socket.io.js'}),   // provided by io.listen(server...)
            SCRIPT({src: CLIENTRESOURCES.jquery}),
            SCRIPT({src: CLIENTRESOURCES.wikifunctions})
          ),
          BODY(
            DIV({id: 'header'},
              DIV({id: 'title'}, page),
              DIV({id: 'navi'},
                A({id: 'editbutton', href: '#/edit'}, 'edit'),
                SPAN({id: 'deletebutton'}, ' | ', A({href: '#/delete'}, 'delete'))
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
 * Main application
 **********************************************************/

//////////////////// setup router

var route = {
  '/(static)/(.*)': {
    get:  rtr_getFile
  },
  '/(lib)/(.*)': {
    get:  rtr_getFile
  },
  '/(node_modules)/(.*)': {
    get:  rtr_getFile
  },
  PAGEPREFIX: {
    '/(.+)': {
      get: rtr_getPage
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


//////////////////// setup server

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

server.listen(LISTENPORT);


//////////////////// setup socket.io-listener

var ioListener = io.listen(server, {log: false});
ioListener.sockets.on('connection', function (socket) {
  // anonymous functions for socket.io-events. TODO maybe use events instead of CSP?

  // editPrepare-event
  socket.on('editPrepare', function (data) {    // TODO check params, especially pagename
    if (DEBUG) {
      console.log('Received io event editPrepare for page "' + data.pagename + '".');
    }

    loadWikiPage(data.pagename, function (err, data) {
      if (err) {
        if (DEBUG) {
          console.log('Emitting error, error occured: ' + data);
        }
        socket.emit('error', {pagename: data.pagename, error: data});
      } else {
        if (DEBUG) {
          console.log('Emitting editStart, sending markdown...');
        }
        socket.emit('editStart',  {pagename: data.pagename, pagecontent: data});
      }
    });
  });

  // save-event
  socket.on('save', function (data) {    // TODO check params, especially pagename
    if (DEBUG) {
      console.log('Received io event save for page "' + data.pagename + '".');
    }

    data.user = {name: 'The Wiki', email: 'wiki@localhost'};  // TODO session-based credentials
    data.changemessage = 'Edited in wiki';  // TODO can asked from the user

    saveWikiPage(data, function (err, data) {
      if (err) {
        if (DEBUG) {
          console.log('Emitting error, error occured: ' + data);
        }
        socket.emit('error', {pagename: data.pagename, error: data});
      } else {
        if (DEBUG) {
          console.log('Emitting pageSaved, sending markdown...');
        }
        socket.emit('pageSaved',  {pagename: data.pagename, pagecontent: data});
      }
    });
  });

  // delete-event
  socket.on('delete', function (data) {    // TODO check params, especially pagename
    if (DEBUG) {
      console.log('Received io event delete for page "' + data.pagename + '".');
    }

    data.user = {name: 'The Wiki', email: 'wiki@localhost'};  // TODO session-based credentials
    data.changemessage = 'Deleted in wiki';  // TODO can asked from the user

    deleteWikiPage(data, function (err, cbdata) {
      if (err) {
        if (DEBUG) {
          console.log('Emitting error, error occured: ' + cbdata);
        }
        socket.emit('error', {pagename: data.pagename, error: cbdata});
      } else {
        if (DEBUG) {
          console.log('Emitting pageSaved with NEWPAGE');
        }
        socket.emit('pageSaved',  {pagename: data.pagename, pagecontent: '%#%NEWPAGE%#%'});
      }
    });
  });
});

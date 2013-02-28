/*
 * Copyright 2013 Berne University of Applied Sciences (BUAS) -- http://bfh.ch
 * Author: Pascal Mainini <pascal.mainini@bfh.ch>
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * THIS FILE HAS NO DEFINITIVE LICENSING INFORMATION.
 * LICENSE IS SUBJECT OF CHANGE ANYTIME SOON - DO NOT DISTRIBUTE!
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 */

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true, white:false */
/*global DOCUMENT:true, HTML:true, HEAD:true, BODY:true, META:true, TITLE:true, LINK:true, SCRIPT:true, A:true, DIV:true SPAN:true */


/***********************************************************
 * Initialisation
 **********************************************************/

'use strict';

// TODO: make options configurable
var AUDITLOG = true;
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

var filesystem = require('fs'),
  pagedown = require('pagedown'),
  restify = require('restify'),
  git = require('gitty'),
  bunyan = require('bunyan');

var logger = bunyan.createLogger({    // ISSUE stuff logged with logger.debug somehow doesn't appear at all...
  name: 'wiki',
  stream: process.stdout,
  src: true
});


/***********************************************************
 * Function definitions
 **********************************************************/

//////////////////// helper-functions

/*
 * Helper for handling callbacks of repo.*
 * Properly inform user via callback and return true/false for continuing or
 * aborting the CSP.
 */
var gitSuccess = function (err, callback) {
  if (err) {
    logger.error({error: err}, 'git error: %s', err);

    if (callback) {
      callback(true, 'Error occured while saving page : ' + err);
    }

    return false;
  } else {
    return true;
  }
};


//////////////////// REST-API

/*
 * Loads the contents of a wikipage (in markdown) from WIKIDATA
 */
var api_getPage = function (req, res, next) {
  var pageName = req.params.name;
  var fileName = WIKIDATA + '/' + pageName + '.md';

  logger.info({fileName: fileName, page: {title: pageName}}, 'api_loadWikiPage: %s', fileName);

  filesystem.exists(fileName, function _fsExists (exists) {
    if (exists) {
      filesystem.readFile(fileName, 'utf8', function _readErr (err, file) {
        if (err) {
          logger.error({error: err, fileName: fileName, page: {title: pageName}}, 'ERROR: Error occured while loading page: %s', err);
          return next(err);
        } else {
          return next({page: {content: file, title: req.params.name}});
        }
      });
    } else {
      logger.info('Page does not exist, returning empty content.');
      next({page: {content: null, title: pageName}});
    }
  });
};

/*
 * Saves the contents (markdown) of a wikipage to WIKIDATA and commits it
 * in git.
 */
var api_savePage = function (req, res, next) {

  return next();

/* TO BE FIXED
  var fileName = WIKIDATA + '/' + data.page.name + '.md';

  logger.info({fileName: fileName, page: {name: data.page.name}}, 'saveWikiPage: %s', fileName);

  // TODO synchronize the whole thing somehow?
  filesystem.writeFile(fileName, data.page.content, 'utf8', function _writeErr(err) {
    if (err) {
      logger.error({error: err, fileName: fileName, page: {name: data.pagename}}, 'Error occured while saving page: %s', err);
      callback(true, 'Error occured while saving page : ' + err);
    } else {
      var repo = new git.Repository(WIKIDATA);
      var gitFiles = [data.page.name + '.md'];

//      git.config('user.name', data.user.name, function _gitConfigNameErr (err) {   // BUG overrides global config
//        if (gitSuccess(err, callback)) {
//          git.config('user.email', data.user.email, function _gitConfigEMail(err) {
//            if (gitSuccess(err, callback)) {
              repo.add(gitFiles, function _gitAddErr (err) {
                if (gitSuccess(err, callback)) {
                  repo.commit(data.changemessage, function _gitCommitErr (err) {
                    if (gitSuccess(err, callback)) {
                      logger.info({fileName: fileName, page: {name: data.page.name}}, 'Successfully committed page %s', data.page.name);
                    } else {
                      gitSuccess('repo.commit failed', null); // TODO ugly
                      repo.unstage(gitFiles, gitSuccess);
                    }
                  });
                } else {
                  gitSuccess('repo.add failed', null); // TODO ugly
                  repo.unstage(gitFiles, gitSuccess);
                }
              });
//            }
//          });
//        }
//      });
    }
  });

  loadWikiPage(data.page.name, callback);    // reload page from storage and give it back to caller

*/
};

/*
 * Deletes a page from git and fs.
 */
var api_deletePage = function (req, res, next) {

  return next();

/* TO BE FIXED
  var fileName = WIKIDATA + '/' + data.page.name + '.md';
  var repo = new git.Repository(WIKIDATA);
  var gitFiles = [data.page.name + '.md'];

  logger.info({fileName: fileName, page: {name: data.page.name}}, 'deleteWikiPage: %s', data.page.name);

//  git.config('user.name', data.user.name, function _gitConfigNameErr (err) {   // BUG overrides global config
//    if (gitSuccess(err, callback)) {
//      git.config('user.email', data.user.email, function _gitConfigEMailErr (err) {
//        if (gitSuccess(err, callback)) {
          repo.remove(gitFiles, function _gitRemoveErr (err) {
            if (gitSuccess(err, callback)) {
              repo.commit(data.changemessage, function _gitCommitErr (err) {
                if (gitSuccess(err, callback)) {
                  filesystem.unlink(fileName, function _unlinkErr (err) {
                    if (err) {
                      logger.error({page: {name: data.page.name}, fileName: fileName, error: err}, 'Error while deleting page: %s', err);
                      callback(true, err);
                    } else {
                      logger.info({page: {Name: data.page.name}, fileName: fileName}, 'Successfully deleted page %s', data.page.name);
                      callback(false, null);
                    }
                  });
                } else {
                  gitSuccess('repo.commit failed', null); // TODO ugly
                }
              });
            } else {
              gitSuccess('repo.remove failed', null); // TODO ugly
            }
          });
//        }
//      });
//    }
//  });

*/
};


//////////////////// output-formatters

/**
 * Formatter used when request is text/html
 */
var fmt_Html = function (req, res, body) {

  if (body instanceof Error) {

    return DOCUMENT(
      HTML({lang: 'en'},
        HEAD(
          META({charset: 'utf-8'}),
          TITLE(body.statusCode ? body.statusCode  + ': ' + body.message : body.message)
        ),
        BODY(
          DIV({id: 'wikierror'}, (body.statusCode ? body.statusCode  + ': ' + body.message : body.message))
        )
      )
    ).outerHTML + '\n';

  } else {

    var pageContent;
    if (body.page.content) {
      pageContent = pagedown.getSanitizingConverter().makeHtml(body.page.content);   // or: new pagedown.Converter();
    } else {
      pageContent = '%#%NEWPAGE%#%';
    }

    return DOCUMENT(
      HTML({lang: 'en'},
        HEAD(
          META({charset: 'utf-8'}),
          TITLE(body.page.title),
          LINK({rel: 'stylesheet', type: 'text/css', href: CLIENTRESOURCES.md_styles}),
          SCRIPT({src: CLIENTRESOURCES.domo}),
          SCRIPT({src: CLIENTRESOURCES.director}),
          SCRIPT({src: CLIENTRESOURCES.md_converter}),
          SCRIPT({src: CLIENTRESOURCES.md_sanitizer}),
          SCRIPT({src: CLIENTRESOURCES.md_editor}),
          SCRIPT({src: CLIENTRESOURCES.jquery}),
          SCRIPT({src: CLIENTRESOURCES.wikifunctions})
        ),
        BODY(
          DIV({id: 'header'},
            DIV({id: 'title'}, body.page.title),
            DIV({id: 'navi'},
              A({id: 'editbutton', href: '#/edit'}, 'edit'),
              SPAN({id: 'deletebutton'}, ' | ', A({href: '#/delete'}, 'delete'))
            )
          ),
          DIV({id: 'wikieditor'}),
          DIV({id: 'wikicontent'}, '%#%PAGECONTENT%#%')
        )
      )
    ).outerHTML.replace('%#%PAGECONTENT%#%', pageContent) + '\n';   // or: new pagedown.Converter();

  }
};

/**
 * Formatter used when request is text/plain
 * @param {String} array of accept types.   TODO use these everywhere
 * @return
 */
var fmt_Text = function (req, res, body) {
  if (body instanceof Error) {
    return 'Error!\n\n' +
      (body.statusCode ? 'Statuscode: ' + body.statusCode + '\n' : '') +
      'Message: ' + body.message + '\n';
  } else {
    return 'Title: ' + body.page.title +
      '\n------------------ START CONTENT --------------------\n' +
      body.page.content +
      '\n------------------- END CONTENT ---------------------\n';
  }
};


/***********************************************************
 * Main application
 **********************************************************/

//////////////////// setup server

var server = restify.createServer({
  formatters: {
    'text/html': fmt_Html,
    'text/plain': fmt_Text,
    '*/*': fmt_Html           // ISSUE workaround for seemingly improper accept-header-evaluation by restify...
  }
});  // TODO SSL...

//// server: events
if (AUDITLOG) {
  server.on('after', restify.auditLogger({log: logger}));
}

//// server: general handlers
server.use(restify.requestLogger());    // ISSUE requestLogger logs NOTHING!
server.use(restify.bodyParser());
server.use(restify.acceptParser(server.acceptable));

//// server: static content
server.get(/\/static\/?.*/, restify.serveStatic({directory: '.'}));   // ISSUE serveStatic doesn't emit NotFound-event...
server.get(/\/lib\/?.*/, restify.serveStatic({directory: '.'}));
server.get(/\/node_modules\/?.*/, restify.serveStatic({directory: '.'}));

//// server: page API
server.get(PAGEPREFIX + '/:name', api_getPage);   // TODO GET redirect / -> /page/main
server.put(PAGEPREFIX + '/:name', api_savePage);
server.post(PAGEPREFIX + '/:name', api_savePage);
server.del(PAGEPREFIX + '/:name', api_deletePage);

//// start server
server.listen(LISTENPORT, function listenCallback () {
  logger.info({serverName: server.name, serverURL: server.url}, '%s listening at %s.', server.name, server.url);
});

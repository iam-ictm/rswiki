/**
 * @file Testcases for rswiki's HTTP-server
 * @copyright 2013-2014 BFH - Bern University of Applied Sciences -- {@link http://bfh.ch}
 * @license MIT, see included file LICENSE or {@link http://opensource.org/licenses/MIT}
 * @author Pascal Mainini <pascal.mainini@bfh.ch>
 * @version 0.1.1
 *
 * This file contains testcases for testing 
 *
 * - The HTTP-server of rswiki in general
 * - CRUD-operations on the page-RESTful-API
 * 
 * @todo start server directly from within the tests
 * @todo test functions directly in server.js (not via HTTP)?
 * @todo test data of other content-types via CRUD?
 * @todo tests for frontend-code?
 */

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true, white:false */
/*global suite:true, test:true */

/***********************************************************
 * Initialisation
 **********************************************************/

'use strict';

var assert = require('assert'),
  nconf = require('nconf'),
  request = require('request');


/***********************************************************
 * Function definitions
 **********************************************************/

/**
 * Wrapper for request.request() for easy setting of some required options.
 *
 * @param   {String}      method    The HTTP-method to use (GET, POST, DELETE...)
 * @param   {String}      uri       URI to request
 * @param   {String}      accept    Accept-header (i.e. content-type) to set
 * @param   {Function}    callback  Callback uppon completion of request
 * @param   {String}      [body]    Body to send in PUT/POST etc. requests
 */
var _request = function _request (method, uri, accept, callback, body) {
  var options = {
    method: method,
    uri: uri
  };

  if (accept) {
    options.headers = {
      accept: accept
    };
  }

  if (body) {
    options.body = body;
    options.headers['content-type'] = accept;
  }

  request(options, callback);
};

/**
 * Wrapper for _request(), predefining a GET-request
 *
 * @param   {String}      method    The HTTP-method to use (GET, POST, DELETE...)
 * @param   {String}      uri       URI to request
 * @param   {String}      accept    Accept-header (i.e. content-type) to set
 * @param   {Function}    callback  Callback uppon completion of request
 */
var _getRequest = function _getRequest (uri, accept, callback) {
  return _request('GET', uri, accept, callback);
};

/**
 * Wrapper for _request(), predefining a PUT-request
 *
 * @param   {String}      uri       URI to request
 * @param   {String}      accept    Accept-header (i.e. content-type) to set
 * @param   {String}      body      Body to send with the request
 * @param   {Function}    callback  Callback uppon completion of request
 */
var _putRequest = function _putRequest (uri, accept, body, callback) {
  return _request('PUT', uri, accept, callback, body);
};

/**
 * Wrapper for _request(), predefining a DELETE-request
 *
 * @param   {String}      uri       URI to request
 * @param   {String}      accept    Accept-header (i.e. content-type) to set
 * @param   {String}      body      Body to send with the request
 * @param   {Function}    callback  Callback uppon completion of request
 */
var _delRequest = function _delRequest (uri, accept, body, callback) {
  return _request('DELETE', uri, accept, callback, body);
};


/***********************************************************
 * Main application
 **********************************************************/

nconf.argv().env().file({
  file: 'config.json'
});

var BASE_URI = 'http://127.0.0.1:' + nconf.get('server:port') + '/';

/**
 * mocha-testsuite for performing some basic tests of the HTTP-server
 */
suite('Basic HTTP tests', function _suite () {

  // @issue disables some tests, somehow they break restify...
  var _performDangerousTests = false;

  var _siteStructure = [
    [
      [BASE_URI, ['GET', null, 500]],
      [BASE_URI, ['GET', 'text/plain', 404]],
      [BASE_URI, ['GET', 'text/html', 404]],
      [BASE_URI, ['GET', 'application/json', 404]],
      [BASE_URI, ['GET', 'foo/bar', 404]],

      [BASE_URI, ['HEAD', null, 500]],
      [BASE_URI, ['POST', null, 500]],
      [BASE_URI, ['PUT', null, 500]],
      [BASE_URI, ['DELETE', null, 500]],

      [BASE_URI, ['HEAD', 'text/html', 404]],
      [BASE_URI, ['POST', 'text/html', 404]],
      [BASE_URI, ['PUT', 'text/html', 404]],
      [BASE_URI, ['DELETE', 'text/html', 404]]
    ],
    [
      [BASE_URI + 'illegalpath', ['GET', null, 500]],
      [BASE_URI + 'illegalpath', ['GET', 'text/plain', 404]],
      [BASE_URI + 'illegalpath', ['GET', 'text/html', 404]],
      [BASE_URI + 'illegalpath', ['GET', 'application/json', 404]],
      [BASE_URI + 'illegalpath', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'illegalpath', ['HEAD', null, 500]],
      [BASE_URI + 'illegalpath', ['POST', null, 500]],
      [BASE_URI + 'illegalpath', ['PUT', null, 500]],
      [BASE_URI + 'illegalpath', ['DELETE', null, 500]],

      [BASE_URI + 'illegalpath', ['HEAD', 'text/html', 404]],
      [BASE_URI + 'illegalpath', ['POST', 'text/html', 404]],
      [BASE_URI + 'illegalpath', ['PUT', 'text/html', 404]],
      [BASE_URI + 'illegalpath', ['DELETE', 'text/html', 404]]
    ],
    [
      [BASE_URI + 'static/', ['GET', null, 500]],
      [BASE_URI + 'static/', ['GET', 'text/plain', 404]],
      [BASE_URI + 'static/', ['GET', 'text/html', 404]],
      [BASE_URI + 'static/', ['GET', 'application/json', 404]],
      [BASE_URI + 'static/', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'static/', ['HEAD', null, 500]],
      [BASE_URI + 'static/', ['POST', null, 500]],
      [BASE_URI + 'static/', ['PUT', null, 500]],
      [BASE_URI + 'static/', ['DELETE', null, 500]],

      [BASE_URI + 'static/', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'static/', ['POST', 'text/html', 405]],
      [BASE_URI + 'static/', ['PUT', 'text/html', 405]],
      [BASE_URI + 'static/', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'static/illegalpath', ['GET', null, 500]],
      [BASE_URI + 'static/illegalpath', ['GET', 'text/plain', 404]],
      [BASE_URI + 'static/illegalpath', ['GET', 'text/html', 404]],
      [BASE_URI + 'static/illegalpath', ['GET', 'application/json', 404]],
      [BASE_URI + 'static/illegalpath', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'static/illegalpath', ['HEAD', null, 500]],
      [BASE_URI + 'static/illegalpath', ['POST', null, 500]],
      [BASE_URI + 'static/illegalpath', ['PUT', null, 500]],
      [BASE_URI + 'static/illegalpath', ['DELETE', null, 500]],

      [BASE_URI + 'static/illegalpath', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'static/illegalpath', ['POST', 'text/html', 405]],
      [BASE_URI + 'static/illegalpath', ['PUT', 'text/html', 405]],
      [BASE_URI + 'static/illegalpath', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'static/wikifunctions.js', ['GET', null, 500]],
      [BASE_URI + 'static/wikifunctions.js', ['GET', 'text/plain', 200]],
      [BASE_URI + 'static/wikifunctions.js', ['GET', 'text/html', 200]],
      [BASE_URI + 'static/wikifunctions.js', ['GET', 'application/json', 200]],
      [BASE_URI + 'static/wikifunctions.js', ['GET', 'foo/bar', 200]],

      [BASE_URI + 'static/wikifunctions.js', ['HEAD', null, 500]],
      [BASE_URI + 'static/wikifunctions.js', ['POST', null, 500]],
      [BASE_URI + 'static/wikifunctions.js', ['PUT', null, 500]],
      [BASE_URI + 'static/wikifunctions.js', ['DELETE', null, 500]],

      [BASE_URI + 'static/wikifunctions.js', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'static/wikifunctions.js', ['POST', 'text/html', 405]],
      [BASE_URI + 'static/wikifunctions.js', ['PUT', 'text/html', 405]],
      [BASE_URI + 'static/wikifunctions.js', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'lib/', ['GET', null, 500]],
      [BASE_URI + 'lib/', ['GET', 'text/plain', 404]],
      [BASE_URI + 'lib/', ['GET', 'text/html', 404]],
      [BASE_URI + 'lib/', ['GET', 'application/json', 404]],
      [BASE_URI + 'lib/', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'lib/', ['HEAD', null, 405], _performDangerousTests],
      [BASE_URI + 'lib/', ['POST', null, 405], _performDangerousTests],
      [BASE_URI + 'lib/', ['PUT', null, 405], _performDangerousTests],
      [BASE_URI + 'lib/', ['DELETE', null, 405], _performDangerousTests],

      [BASE_URI + 'lib/', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'lib/', ['POST', 'text/html', 405]],
      [BASE_URI + 'lib/', ['PUT', 'text/html', 405]],
      [BASE_URI + 'lib/', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'lib/illegalpath', ['GET', null, 500]],
      [BASE_URI + 'lib/illegalpath', ['GET', 'text/plain', 404]],
      [BASE_URI + 'lib/illegalpath', ['GET', 'text/html', 404]],
      [BASE_URI + 'lib/illegalpath', ['GET', 'application/json', 404]],
      [BASE_URI + 'lib/illegalpath', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'lib/illegalpath', ['HEAD', null, 500]],
      [BASE_URI + 'lib/illegalpath', ['POST', null, 500]],
      [BASE_URI + 'lib/illegalpath', ['PUT', null, 500]],
      [BASE_URI + 'lib/illegalpath', ['DELETE', null, 500]],

      [BASE_URI + 'lib/illegalpath', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'lib/illegalpath', ['POST', 'text/html', 405]],
      [BASE_URI + 'lib/illegalpath', ['PUT', 'text/html', 405]],
      [BASE_URI + 'lib/illegalpath', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'lib/jquery.js', ['GET', null, 500]],
      [BASE_URI + 'lib/jquery.js', ['GET', 'text/plain', 200]],
      [BASE_URI + 'lib/jquery.js', ['GET', 'text/html', 200]],
      [BASE_URI + 'lib/jquery.js', ['GET', 'application/json', 200]],
      [BASE_URI + 'lib/jquery.js', ['GET', 'foo/bar', 200]],

      [BASE_URI + 'lib/jquery.js', ['HEAD', null, 405], _performDangerousTests],
      [BASE_URI + 'lib/jquery.js', ['POST', null, 405], _performDangerousTests],
      [BASE_URI + 'lib/jquery.js', ['PUT', null, 405], _performDangerousTests],
      [BASE_URI + 'lib/jquery.js', ['DELETE', null, 405], _performDangerousTests],

      [BASE_URI + 'lib/jquery.js', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'lib/jquery.js', ['POST', 'text/html', 405]],
      [BASE_URI + 'lib/jquery.js', ['PUT', 'text/html', 405]],
      [BASE_URI + 'lib/jquery.js', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'node_modules/', ['GET', null, 500]],
      [BASE_URI + 'node_modules/', ['GET', 'text/plain', 404]],
      [BASE_URI + 'node_modules/', ['GET', 'text/html', 404]],
      [BASE_URI + 'node_modules/', ['GET', 'application/json', 404]],
      [BASE_URI + 'node_modules/', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'node_modules/', ['HEAD', null, 405], _performDangerousTests],
      [BASE_URI + 'node_modules/', ['POST', null, 405], _performDangerousTests],
      [BASE_URI + 'node_modules/', ['PUT', null, 405], _performDangerousTests],
      [BASE_URI + 'node_modules/', ['DELETE', null, 405], _performDangerousTests],

      [BASE_URI + 'node_modules/', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'node_modules/', ['POST', 'text/html', 405]],
      [BASE_URI + 'node_modules/', ['PUT', 'text/html', 405]],
      [BASE_URI + 'node_modules/', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'node_modules/illegalpath', ['GET', null, 500]],
      [BASE_URI + 'node_modules/illegalpath', ['GET', 'text/plain', 404]],
      [BASE_URI + 'node_modules/illegalpath', ['GET', 'text/html', 404]],
      [BASE_URI + 'node_modules/illegalpath', ['GET', 'application/json', 404]],
      [BASE_URI + 'node_modules/illegalpath', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'node_modules/illegalpath', ['HEAD', null, 500]],
      [BASE_URI + 'node_modules/illegalpath', ['POST', null, 500]],
      [BASE_URI + 'node_modules/illegalpath', ['PUT', null, 500]],
      [BASE_URI + 'node_modules/illegalpath', ['DELETE', null, 500]],

      [BASE_URI + 'node_modules/illegalpath', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'node_modules/illegalpath', ['POST', 'text/html', 405]],
      [BASE_URI + 'node_modules/illegalpath', ['PUT', 'text/html', 405]],
      [BASE_URI + 'node_modules/illegalpath', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'node_modules/restify/', ['GET', null, 500]],
      [BASE_URI + 'node_modules/restify/', ['GET', 'text/plain', 404]],
      [BASE_URI + 'node_modules/restify/', ['GET', 'text/html', 404]],
      [BASE_URI + 'node_modules/restify/', ['GET', 'application/json', 404]],
      [BASE_URI + 'node_modules/restify/', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'node_modules/restify/', ['HEAD', null, 500]],
      [BASE_URI + 'node_modules/restify/', ['POST', null, 500]],
      [BASE_URI + 'node_modules/restify/', ['PUT', null, 500]],
      [BASE_URI + 'node_modules/restify/', ['DELETE', null, 500]],

      [BASE_URI + 'node_modules/restify/', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/', ['POST', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/', ['PUT', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'node_modules/restify/illegalpath', ['GET', null, 500]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['GET', 'text/plain', 404]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['GET', 'text/html', 404]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['GET', 'application/json', 404]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'node_modules/restify/illegalpath', ['HEAD', null, 500]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['POST', null, 500]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['PUT', null, 500]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['DELETE', null, 500]],

      [BASE_URI + 'node_modules/restify/illegalpath', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['POST', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['PUT', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/illegalpath', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'node_modules/restify/README.md', ['GET', null, 500]],
      [BASE_URI + 'node_modules/restify/README.md', ['GET', 'text/plain', 200]],
      [BASE_URI + 'node_modules/restify/README.md', ['GET', 'text/html', 200]],
      [BASE_URI + 'node_modules/restify/README.md', ['GET', 'application/json', 200]],
      [BASE_URI + 'node_modules/restify/README.md', ['GET', 'foo/bar', 200]],

      [BASE_URI + 'node_modules/restify/README.md', ['HEAD', null, 500]],
      [BASE_URI + 'node_modules/restify/README.md', ['POST', null, 500]],
      [BASE_URI + 'node_modules/restify/README.md', ['PUT', null, 500]],
      [BASE_URI + 'node_modules/restify/README.md', ['DELETE', null, 500]],

      [BASE_URI + 'node_modules/restify/README.md', ['HEAD', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/README.md', ['POST', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/README.md', ['PUT', 'text/html', 405]],
      [BASE_URI + 'node_modules/restify/README.md', ['DELETE', 'text/html', 405]]
    ],
    [
      [BASE_URI + 'page/', ['GET', null, 500]],
      [BASE_URI + 'page/', ['GET', 'text/plain', 404]],
      [BASE_URI + 'page/', ['GET', 'text/html', 404]],
      [BASE_URI + 'page/', ['GET', 'application/json', 404]],
      [BASE_URI + 'page/', ['GET', 'foo/bar', 404]],

      [BASE_URI + 'page/', ['HEAD', null, 500]],
      [BASE_URI + 'page/', ['POST', null, 500]],
      [BASE_URI + 'page/', ['PUT', null, 500]],
      [BASE_URI + 'page/', ['DELETE', null, 500]],

      [BASE_URI + 'page/', ['HEAD', 'text/html', 404]],
      [BASE_URI + 'page/', ['POST', 'text/html', 404]],
      [BASE_URI + 'page/', ['PUT', 'text/html', 404]],
      [BASE_URI + 'page/', ['DELETE', 'text/html', 404]]
    ]
  ];

  _siteStructure.forEach(function _iterateSite (uri) {
    uri.forEach(function _iterateURI (current) {

      var runTest = true;

      if (current.length > 2) {   // check for additional options
        runTest = current[2];
      }

      if (runTest) {

        // mocha-test being run for every configured request of all URI's specified in siteStructure.
        test(current[1][0] + ' ' + current[0] + ' with accept-header "' + current[1][1] + '" should return ' + current[1][2], function _test (done) {
          _request(current[1][0], current[0], current[1][1], function _response (error, response) {
            if (error) {
              throw error;
            }

            assert.equal(response.statusCode, current[1][2]);
            done();
          });
        });

      }

    });
  });
});

/**
 * mocha-testsuite for performing CRUD-tests on the page-RESTful-API
 */
suite('Page CRUD', function _suite () {

  var _PAGE = 'mocha';
  var _PAGE_URI = BASE_URI + 'page/';

  /**
   * A test-function which checks if a given page is empty.
   *
   * @param   {Function}    done    mocha-callback to call when the test has finished
   * @param   {String}      page    Name of the page
   */
  var _pageEmptyTest = function _pageEmptyTest (done, page) {
    _getRequest(_PAGE_URI + page, 'application/json', function _response (error, response, body) {
      if (error) {
        throw error;
      }

      assert.equal(200, response.statusCode);
      assert(body, 'Received response body');

      var data = JSON.parse(body);
      assert(data.page, 'body contains page-object');
      assert(data.page.name, 'page object has name-attribute');
      assert.equal(data.page.name, 'mocha', 'page.name is "mocha"');
      assert(!data.page.content, 'page.content is empty');

      done();
    });
  };

  /**
   * A test-function which checks if the content of a given page matches the given content
   *
   * @param   {Function}    done    mocha-callback to call when the test has finished
   * @param   {String}      page    Name of the page
   * @param   {String}      content Content to check the page for
   */
  var _pageContentTest = function _pageContentTest (done, page, content) {
    _getRequest(_PAGE_URI + page, 'application/json', function _response (error, response, body) {
      if (error) {
        throw error;
      }

      assert.equal(200, response.statusCode);
      assert(body, 'Received response body');

      var data = JSON.parse(body);
      assert(data.page, 'body contains page-object');
      assert(data.page.name, 'page object has name-attribute');
      assert.equal(data.page.name, 'mocha', 'page.name is "mocha"');
      assert.equal(data.page.content, content, 'page.content contains "' + content + '"');

      done();
    });
  };

  /**
   * A test-function which creates or updates (PUT) a given page
   *
   * @param   {Function}    done            mocha-callback to call when the test has finished
   * @param   {String}      page            Name of the page
   * @param   {String}      content         Content to set the page to
   * @param   {String}      changeMessage   Message used for the commit in the wiki-git
   */
  var _pageUpdateTest = function _pageUpdateTest (done, page, content, changeMessage) {
    var pageContent = {page:{content:content, name:page, changeMessage: changeMessage}};

    _putRequest(_PAGE_URI + page, 'application/json', JSON.stringify(pageContent), function _response (error, response) {
      if (error) {
        throw error;
      }

      assert.equal(response.statusCode, 200);
      done();
    });
  };

  /**
   * A test-function which deletes a given page
   *
   * @param   {Function}    done            mocha-callback to call when the test has finished
   * @param   {String}      page            Name of the page
   * @param   {String}      changeMessage   Message used for the commit in the wiki-git
   */
  var _pageDeleteTest = function _pageDeleteTest (done, page, changeMessage) {
    var pageContent = {page:{name:page, changeMessage: changeMessage}};

    _delRequest(_PAGE_URI + page, 'application/json', JSON.stringify(pageContent), function _response (error, response) {
      if (error) {
        throw error;
      }

      assert.equal(response.statusCode, 200);
      done();
    });
  };

  // Check that the page doesn't exist yet
  test(_PAGE_URI + _PAGE + ' should not exist', function _test(done) {
    _pageEmptyTest(done, _PAGE);
  });

  // Create the page
  test('Create ' + _PAGE_URI + _PAGE, function _test(done) {
    _pageUpdateTest(done, _PAGE, 'mocha was here!', 'Created by mocha!');
  });

  // Check if page has been created correctly
  test(_PAGE_URI + _PAGE + ' should now contain "mocha was here!"', function _test (done) {
    _pageContentTest(done, _PAGE, 'mocha was here!');
  });

  // Update the page
  test('Update ' + _PAGE_URI + _PAGE, function _test(done) {
    _pageUpdateTest(done, _PAGE, 'mocha will soon be gone!', 'Updated by mocha!');
  });

  // Check if the page has been correctly updated
  test(_PAGE_URI + _PAGE + ' should now contain "mocha will soon be gone!"', function _test (done) {
    _pageContentTest(done, _PAGE, 'mocha will soon be gone!');
  });

  // Delete the page
  test('Delete ' + _PAGE_URI + _PAGE, function _test (done) {
    _pageDeleteTest(done, _PAGE, 'Deleted by mocha!');
  });

  // Check if the page has been properly deleted
  test(_PAGE_URI + _PAGE + ' should not exist', function _test(done) {
    _pageEmptyTest(done, _PAGE);
  });

});

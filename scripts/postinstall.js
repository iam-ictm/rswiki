/**
 * @file Postinstall-script for npm-package-manager
 * @copyright 2013-2014 BFH - Bern University of Applied Sciences -- {@link http://bfh.ch}
 * @license MIT, see included file LICENSE or {@link http://opensource.org/licenses/MIT}
 * @author Pascal Mainini <pascal.mainini@bfh.ch>
 * @version 0.1.1
 *
 * This script is run by npm after the installation. It is responsible for downloading
 * additional dependencies which are not (or not in a form needed) available as npm-packages.
 */

/*jshint node:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true, white:false */
/*global EXTERNAL_FILES:true */

/***********************************************************
 * Initialisation
 **********************************************************/

'use strict';

var request = require('request'),
  fs = require('fs');

var EXTERNAL_FILES = [
  ['lib/jquery.js','http://code.jquery.com/jquery-1.9.1.min.js'],
  ['lib/jquery.rest.js','http://raw.github.com/jpillora/jquery.rest/gh-pages/dist/jquery.rest.min.js'],
  ['lib/wmd-editor/Markdown.Editor.js', 'http://raw.github.com/ujifgc/pagedown/master/Markdown.Editor.js'],
  ['lib/wmd-editor/wmd-buttons.png','http://raw.github.com/ujifgc/pagedown/master/wmd-buttons.png']
];


/***********************************************************
 * Function definitions
 **********************************************************/

/**
 * This function gets called when all EXTERNAL_FILES have been fetched.
 * Currently it only informs the user, that the postinstall-script has finished its duty.
 */
var _fetchDone = function _fetchDone () {
  console.log('Done fetching files!');
  console.log('rswiki postinstall script finished!');
};

/**
 * This function asynchronously fetches all the resources given in the EXTERNAL_FILES-array
 */
var _fetchFiles = function _fetchFiles() {
  console.log('Fetching files...');

  var runningRequests = 0;

  EXTERNAL_FILES.forEach(function _element(file) {
    console.log('Retrieving ' + file[1] + '...');

    var readable = request(file[1]);
    runningRequests++;

    readable.on('end', function _end () {
      runningRequests--;
      if (runningRequests === 0) {
        _fetchDone();
      }
    });

    readable.on('error', function _error (err) {
      console.log('Error occured: ' + err);
      runningRequests--;
      if (runningRequests === 0) {
        _fetchDone();
      }
    });

    readable.pipe(fs.createWriteStream(file[0]));
  });
};


/***********************************************************
 * Main application
 **********************************************************/

console.log('rswiki postinstall script running...');

fs.exists('lib/wmd-editor', function _exists (exists) {
  if (!exists) {
    console.log('Creating directory lib/wmd-editor...');
    fs.mkdir('lib/wmd-editor', function _callback (err) {
      if (err) {
        console.log('Error occured: ' + err.constructor.name);
        process.exit(1);
      } else {
        _fetchFiles();
      }
    });
  } else {
    _fetchFiles();
  }
});

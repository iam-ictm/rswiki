var request = require('request'),
  fs = require('fs');

var EXTERNAL_FILES = [ 
  ['lib/jquery.js','http://code.jquery.com/jquery-1.9.1.min.js'],
  ['lib/jquery.rest.js','http://raw.github.com/lyconic/jquery.rest/master/jquery.rest.js'],
  ['lib/wmd-editor/Markdown.Editor.js', 'http://raw.github.com/ujifgc/pagedown/master/Markdown.Editor.js'],
  ['lib/wmd-editor/wmd-buttons.png','http://raw.github.com/ujifgc/pagedown/master/wmd-buttons.png']
];

console.log('rswiki postinstall script running...');

var _fetchDone = function _fetchDone () {
  console.log('Done fetching files!');
};

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


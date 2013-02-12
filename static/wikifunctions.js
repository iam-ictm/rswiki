/*jshint jquery:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, regexp:true, undef:true, unused: true, trailing:true */
/*global io:true, Markdown:true, Router:true, A:true, TEXTAREA:true, DIV:true */

(function () {
  'use strict';

  var pagename = 'main';

  var socket = io.connect('http://localhost:8080');

  var edit = function () {
    socket.emit('editPrepare', {pagename: pagename});
  };

  var editStart = function (data) {
    $('#wikicontent').hide();
    $('#wikieditor').append(
      DIV(
       DIV({'class': 'wmd-panel'},
        DIV({id: 'wmd-button-bar'}),
          TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}, data.pagecontent),
          DIV(
            A({href: '#/save'}, 'Save'), ' | ',
            A({href: '#/cancel'}, 'Cancel'))
        ),
      DIV({id: 'wmd-preview', 'class': 'wmd-panel wmd-preview'}))
    );

    var converter = Markdown.getSanitizingConverter();
    var editor = new Markdown.Editor(converter);
    editor.run();
  };

  var error = function (data) {
    $('#wikicontent').empty();
    $('#wikicontent').append(
      DIV({id: 'wikierror'}, 'Something terribly failed: ' + data.error)
    );
  };

  var pageSaved = function (data) {
    // TODO reset location
    $('#wikieditor').empty();
    $('#wikicontent').empty();
    $('#wikicontent').append(Markdown.getSanitizingConverter().makeHtml(data.pagecontent));
    $('#wikicontent').show();
  };

  var save = function () {
    socket.emit('save', {pagename: pagename, markdown: $('#wmd-input').val()});
  };

  var cancel = function () {
    // TODO reset location
    $('#wikieditor').empty();
    $('#wikicontent').show();
  };

  var routes = {
    '/edit': edit,
    '/save': save,
    '/cancel': cancel
  };

  var router = new Router(routes);
  router.init();

  socket.on('editStart', editStart);
  socket.on('error', error);
  socket.on('pageSaved', pageSaved);
})();

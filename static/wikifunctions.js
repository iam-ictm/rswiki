/*jshint jquery:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, regexp:true, undef:true, unused: true, trailing:true */
/*global io:true, Markdown:true, Router:true, A:true, TEXTAREA:true, DIV:true */

(function () {
  'use strict';
  var socket = io.connect('http://localhost:8080');

  var edit = function () {
    $('#wikicontent').hide();
    $('#wikieditor').append(
      DIV(
        DIV({'class': 'wmd-panel'},
          DIV({id: 'wmd-button-bar'}),
          TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}),
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

  var save = function () {
    $('#wikieditor').empty();
    $('#wikicontent').show();
  };

  var cancel = function () {
    socket.emit('cancel', { my: 'data' });
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
})();

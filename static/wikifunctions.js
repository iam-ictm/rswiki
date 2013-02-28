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

/*jshint jquery:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, regexp:true, undef:true, unused: true, trailing:true */
/*global document:true, window:true, io:true, Markdown:true, Router:true, A:true, TEXTAREA:true, DIV:true */

$(document).ready(function () {

//////////////////// definitions

  'use strict';

  var socket = io.connect('http://localhost:8080');
  var pagename = window.location.pathname.match(/.*\/page\/(.*)/)[1];


//////////////////// helper-functions

  function switchEditMode() {
    if ($('#wikicontent').text() === '%#%NEWPAGE%#%') {
      $('#wikicontent').empty();
      $('#editbutton').text('create ' + pagename + '...');
      $('#deletebutton').hide();
    } else {
      $('#editbutton').text('edit');
      $('#deletebutton').show();
    }
  }


//////////////////// functions for router

  var rtr_edit = function () {
    socket.emit('editPrepare', {pagename: pagename});
  };

  var rtr_save = function () {
    socket.emit('save', {pagename: pagename, markdown: $('#wmd-input').val()});
  };

  var rtr_cancel = function () {
    // TODO reset location
    $('#wikieditor').empty();
    $('#wikicontent').show();
  };

  var rtr_delete = function () {
    socket.emit('delete', {pagename: pagename});
  };


//////////////////// socket.io-callbacks

  var io_error = function (data) {
    $('#wikicontent').empty();
    $('#wikicontent').append(
      DIV({id: 'wikierror'}, 'Something terribly failed: ' + data.error)
    );
  };

  var io_editStart = function (data) {
    var pagecontent = data.pagecontent === '%#%NEWPAGE%#%' ? '' : data.pagecontent;

    $('#wikicontent').hide();
    $('#wikieditor').append(
      DIV(
       DIV({'class': 'wmd-panel'},
        DIV({id: 'wmd-button-bar'}),
          TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}, pagecontent),
          DIV(
            A({href: '#/save'}, 'save'), ' | ',
            A({href: '#/cancel'}, 'cancel'))
        ),
      DIV({id: 'wmd-preview', 'class': 'wmd-panel wmd-preview'}))
    );

    var converter = Markdown.getSanitizingConverter();
    var editor = new Markdown.Editor(converter);
    editor.run();
  };

  var io_pageSaved = function (data) {
    // TODO reset location
    $('#wikieditor').empty();
    $('#wikicontent').empty();
    $('#wikicontent').append(Markdown.getSanitizingConverter().makeHtml(data.pagecontent));
    $('#wikicontent').show();
    switchEditMode();
  };


//////////////////// main script

  var routes = {
    '/edit': rtr_edit,
    '/save': rtr_save,
    '/cancel': rtr_cancel,
    '/delete': rtr_delete
  };

  var router = new Router(routes);
  router.init();

  socket.on('error', io_error);
  socket.on('editStart', io_editStart);
  socket.on('pageSaved', io_pageSaved);

  switchEditMode();

});

/**
 * @file Clientside-functions for rswiki.
 * @copyright 2013 Berne University of Applied Sciences (BUAS) -- {@link http://bfh.ch}
 * @author Pascal Mainini <pascal.mainini@bfh.ch>
 * @version 0.1.1
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * THIS FILE HAS NO DEFINITIVE LICENSING INFORMATION.
 * LICENSE IS SUBJECT OF CHANGE ANYTIME SOON - DO NOT DISTRIBUTE!
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * This file contains all the clientside functionality needed by rswiki.
 *
 * Basically, it handles clicks on the various "buttons" and performs the needed operations in the appropriate action*-functions.
 * Where needed, callbacks for AJAX-calls are implemented in the according cb_*-functions.
 */

/*jshint jquery:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true, white:false */
/*global document:true, window:true, Markdown:true, A:true, TEXTAREA:true, DIV:true */

$(document).ready(function readyFunction () {

//////////////////// definitions

  'use strict';

  var pageName = window.location.pathname.match(/.*\/page\/(.*)/)[1];

  var rest = new $.RestClient('/');
  rest.add('page', {
    stripTrailingSlash: true
  });


//////////////////// helper-functions

  /**
   * Switches the navigation between "create" and "edit/delete" depending on the
   * contents of the page. If the page is empty, only a create-"button" is displayed,
   * otherwise "edit" and "delete" are shown.
   */
  var switchEditMode = function switchEditMode () {
    if ($('#rswiki_content').text().length === 0) {
      $('#rswiki_content').empty();
      $('#rswiki_button_edit').text('create ' + pageName + '...');
      $('#rswiki_button_delete').hide();
    } else {
      $('#rswiki_button_edit').text('edit');
      $('#rswiki_button_delete').show();
    }
  };


//////////////////// AJAX-callbacks

  /**
   * Callback for the AJAX-GET on page.
   * Hides the normal content, shows and starts the editor.
   *
   * @param   {Object}   data   JSON received, containing our page-object.
   */
  var cb_read = function cb_read (data) {
    var pageContent = data.page.content === null ? '' : data.page.content;

    $('#rswiki_content').hide();
    $('#rswiki_content').empty();
    $('#rswiki_navi').hide();
    $('#rswiki_editor').append(
      DIV(
       DIV({'class': 'wmd-panel'},
        DIV({id: 'wmd-button-bar'}),
          TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}, pageContent),
          DIV(
            A({id: 'rswiki_button_save', href: '#'}, 'save'), ' | ',
            A({id: 'rswiki_button_cancel', href: '#'}, 'cancel'))
        ),
      DIV({id: 'wmd-preview', 'class': 'wmd-panel wmd-preview'}))
    );
    $('#rswiki_editor').show();

    $('#rswiki_button_save').click(actionSave);
    $('#rswiki_button_cancel').click(actionCancel);

    var converter = Markdown.getSanitizingConverter();
    var editor = new Markdown.Editor(converter);
    editor.run();
  };

  /**
   * Callback for the AJAX-PUT on page
   * Hides the editor and shows the normal content.
   *
   * @param   {Object}   data   JSON received, containing our page-object.
   */
  var cb_save = function cb_save (data) {
    $('#rswiki_editor').empty();
    $('#rswiki_editor').hide();
    $('#rswiki_content').empty();
    $('#rswiki_content').append(Markdown.getSanitizingConverter().makeHtml(data.page.content));
    $('#rswiki_content').show();
    $('#rswiki_navi').show();

    switchEditMode();
  };

  /**
   * Callback for the AJAX-DELETE on page.
   * Clears the content and switches editmode.
   *
   * @param   {Object}   data   JSON received, containing our page-object.
   */
  var cb_del = function cb_del (data) {
    $('#rswiki_content').empty();
    if (data.page.content !== null) {
      // that actually should not happen - but we never know...
      $('#rswiki_content').append(Markdown.getSanitizingConverter().makeHtml(data.page.content));
    }
    $('#rswiki_content').show();

    switchEditMode();
  };


//////////////////// click-handlers

  /**
   * Action bound to click() on the edit-"button".
   * Performs an AJAX-GET on the page and registers the callback.
   */
  var actionEdit = function actionEdit () {
    rest.page.read(pageName).done(cb_read);
  };

  /**
   * Action bound to click() on the delete-"button".
   * Performs an AJAX-DELETE on the page and registers the callback.
   */
  var actionDelete = function actionDelete () {
    rest.page.del(pageName, {
      page: {
        changeMessage: 'Deleted using the webpage...' // @todo ask user for this
      }
    }).done(cb_del);
  };

  /**
   * Action bound to click() on the save-"button".
   * Performs an AJAX-PUT on the page and registers the callback.
   */
  var actionSave = function actionSave () {
    rest.page.update(pageName, {
      page: {
        content: $('#wmd-input').val(),               // @todo check for empty content and ask user if he wants to delete the page
        changeMessage: 'Saved using the webpage...'   // @todo provide textfield for this
      }
    }).done(cb_save);
  };

  /**
   * Action bound to click() on the edit-"button".
   * Clears and hides the editor and returns to the previously shown page-content.
   */
  // @todo refetch the page and update jsdoc
  var actionCancel = function actionCancel () {
    $('#rswiki_editor').empty();
    $('#rswiki_navi').show();
    $('#rswiki_content').show();
  };


//////////////////// main-script

  switchEditMode();

  $('#rswiki_button_edit').click(actionEdit);
  $('#rswiki_button_delete').click(actionDelete);

});

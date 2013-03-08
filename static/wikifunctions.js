/**
 * @file Clientside-functions for the wiki.
 * @copyright 2013 Berne University of Applied Sciences (BUAS) -- {@link http://bfh.ch}
 * @author Pascal Mainini <pascal.mainini@bfh.ch>
 * @version 0.1.0
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * THIS FILE HAS NO DEFINITIVE LICENSING INFORMATION.
 * LICENSE IS SUBJECT OF CHANGE ANYTIME SOON - DO NOT DISTRIBUTE!
 *
 * ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING ! WARNING !
 *
 * This file contains all the clientside functionality needed by the wiki.
 *
 * Basically, it handles clicks on the various "buttons" and performs the needed operations in the appropriate action*-functions.
 * Where needed, callbacks for AJAX-calls are implemented in the according cb_*-functions.
 */

/*jshint jquery:true, bitwise:true, curly:true, immed:true, indent:2, latedef:true, newcap:true, noarg: true, noempty:true, nonew:true, quotmark:single, undef:true, unused: true, trailing:true */
/*global document:true, window:true, Markdown:true, A:true, TEXTAREA:true, DIV:true */

// TODO Use FE / NFE instead of FDs... ?

$(document).ready(function () {

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
  function switchEditMode() {
    if ($('#wiki_content').text().length === 0) {
      $('#wiki_content').empty();
      $('#wiki_button_edit').text('create ' + pageName + '...');
      $('#wiki_button_delete').hide();
    } else {
      $('#wiki_button_edit').text('edit');
      $('#wiki_button_delete').show();
    }
  }


//////////////////// AJAX-callbacks

  /**
   * Callback for the AJAX-GET on page.
   * Hides the normal content, shows and starts the editor.
   *
   * @param   {Object}   data   JSON received, containing our page-object.
   */
  function cb_read(data) {
    var pageContent = data.page.content === null ? '' : data.page.content;

    $('#wiki_content').hide();
    $('#wiki_content').empty();
    $('#wiki_navi').hide();
    $('#wiki_editor').append(
      DIV(
       DIV({'class': 'wmd-panel'},
        DIV({id: 'wmd-button-bar'}),
          TEXTAREA({'class': 'wmd-input', id: 'wmd-input'}, pageContent),
          DIV(
            A({id: 'wiki_button_save', href: '#'}, 'save'), ' | ',
            A({id: 'wiki_button_cancel', href: '#'}, 'cancel'))
        ),
      DIV({id: 'wmd-preview', 'class': 'wmd-panel wmd-preview'}))
    );
    $('#wiki_editor').show();

    $('#wiki_button_save').click(actionSave);
    $('#wiki_button_cancel').click(actionCancel);

    var converter = Markdown.getSanitizingConverter();
    var editor = new Markdown.Editor(converter);
    editor.run();
  }

  /**
   * Callback for the AJAX-PUT on page
   * Hides the editor and shows the normal content.
   *
   * @param   {Object}   data   JSON received, containing our page-object.
   */
  function cb_save(data) {
    $('#wiki_editor').empty();
    $('#wiki_editor').hide();
    $('#wiki_content').empty();
    $('#wiki_content').append(Markdown.getSanitizingConverter().makeHtml(data.page.content));
    $('#wiki_content').show();
    $('#wiki_navi').show();

    switchEditMode();
  }

  /**
   * Callback for the AJAX-DELETE on page.
   * Clears the content and switches editmode.
   *
   * @param   {Object}   data   JSON received, containing our page-object.
   */
  function cb_del(data) {
    $('#wiki_content').empty();
    if (data.page.content !== null) {
      // that actually should not happen - but we never know...
      $('#wiki_content').append(Markdown.getSanitizingConverter().makeHtml(data.page.content));
    }
    $('#wiki_content').show();

    switchEditMode();
  }


//////////////////// click-handlers

  /**
   * Action bound to click() on the edit-"button".
   * Performs an AJAX-GET on the page and registers the callback.
   */
  function actionEdit() {
    rest.page.read(pageName).done(cb_read);
  }

  /**
   * Action bound to click() on the delete-"button".
   * Performs an AJAX-DELETE on the page and registers the callback.
   */
  function actionDelete() {
    rest.page.del(pageName, {
      page: {
        changeMessage: 'Deleted using the webpage...' // TODO ask user for this
      }
    }).done(cb_del);
  }

  /**
   * Action bound to click() on the save-"button".
   * Performs an AJAX-PUT on the page and registers the callback.
   */
  function actionSave() {
    rest.page.update(pageName, {
      page: {
        content: $('#wmd-input').val(),               // TODO check for empty content and ask user if he wants to delete the page
        changeMessage: 'Saved using the webpage...'   // TODO provide textfield for this
      }
    }).done(cb_save);
  }

  /**
   * Action bound to click() on the edit-"button".
   * Clears and hides the editor and returns to the previously shown page-content.
   */
  // TODO refetch the page and update jsdoc
  function actionCancel() {
    $('#wiki_editor').empty();
    $('#wiki_navi').show();
    $('#wiki_content').show();
  }


//////////////////// main-script

  switchEditMode();

  $('#wiki_button_edit').click(actionEdit);
  $('#wiki_button_delete').click(actionDelete);

});

// Generated by CoffeeScript 1.4.0
(function() {
  var add_rewrite_list, clear_form, clicked_rewrite_amend, clicked_rewrite_list_item, clicked_rewrite_remove, clicked_save, clicked_tab, disable_form, dragenter, dragleave, drop, enable_form, get_form_element, global, loaded_file, ready, send_changed_message, set_status_message, validation_form;

  global = this;

  global.app = null;

  global.recentry_changed = 0;

  loaded_file = function(e) {
    var read;
    read = e.target.result;
    return document.rewrite.data.value = read.substring(read.indexOf(',') + 1);
  };

  clicked_tab = function() {
    var selected;
    if (!$(this).hasClass('selected')) {
      selected = $('#tabs div.tab.selected').removeClass('selected');
      $("#" + selected.get(0).dataset.panel).hide();
      $(this).addClass('selected');
      return $("#" + this.dataset.panel).show();
    }
  };

  dragenter = function() {
    $(this).css({
      backgroundColor: '#96B9F9'
    });
    return false;
  };

  dragleave = function() {
    $(this).css({
      backgroundColor: '#CCC'
    });
    return false;
  };

  drop = function(e) {
    var file, mime_type, reader;
    if (e.originalEvent.dataTransfer.files.length !== 0) {
      file = e.originalEvent.dataTransfer.files[0];
      if (file.type.length !== 0) {
        mime_type = file.type.split('/');
        document.rewrite.mime_header.value = mime_type[0];
        document.rewrite.mime_body.value = mime_type[1];
      } else {
        document.rewrite.mime_header.value = 'text';
        document.rewrite.mime_body.value = 'plain';
      }
      $('input[ type = "radio" ][ name = "type" ]').val(['binary']);
      reader = new FileReader;
      reader.onloadend = loaded_file;
      reader.readAsDataURL(file);
    }
    $(this).css({
      backgroundColor: '#CCC'
    });
    return false;
  };

  clicked_rewrite_list_item = function() {
    var selected;
    if ($(this).hasClass('selected')) {
      $(this).removeClass('selected');
      return $(this.nextSibling).slideUp(150);
    } else {
      if ((selected = $(this.parentNode).children('div.item.selected')).length !== 0) {
        selected.removeClass('selected');
        $(selected.get(0).nextSibling).slideUp(150);
      }
      $(this).addClass('selected');
      return $(this.nextSibling).slideDown(150);
    }
  };

  clicked_rewrite_amend = function() {
    var rewrite;
    if ((rewrite = global.app.config.get_rewrite(parseInt(this.parentNode.dataset.rewrite))) === null) {
      alert("データを取得できません。ページを再読み込みすると解決する場合があります");
      return;
    }
    $('#status-message').hide();
    $('#edit h2').text('既存の設定を編集中');
    document.rewrite.id.value = rewrite.id;
    document.rewrite.title.value = rewrite.title;
    document.rewrite.url.value = rewrite.url;
    document.rewrite.url_is_regex.checked = rewrite.url_is_regex;
    document.rewrite.mime_header.value = rewrite.mime_header;
    document.rewrite.mime_body.value = rewrite.mime_body;
    $('input[ type = "radio" ][ name = "type" ]').val([rewrite.base64 ? 'binary' : 'text']);
    return document.rewrite.data.value = rewrite.data;
  };

  clicked_rewrite_remove = function() {
    var operation;
    if (confirm("本当に削除しますか？")) {
      operation = this.parentNode;
      return global.app.config.remove(parseInt(operation.dataset.rewrite), function(success, rewrite) {
        if (success) {
          $(operation.previousSibling).remove();
          $(operation).remove();
          if (rewrite.id === parseInt(document.rewrite.id.value)) {
            clear_form();
          }
          return send_changed_message();
        } else {
          return alert("削除に失敗しました");
        }
      });
    }
  };

  clicked_save = function() {
    var base64, data, id, mime_body, mime_header, title, url, url_is_regex;
    if (!validation_form()) {
      return;
    }
    disable_form();
    set_status_message('waiting', '保存中...');
    id = document.rewrite.id.value;
    title = document.rewrite.title.value;
    url = document.rewrite.url.value;
    url_is_regex = document.rewrite.url_is_regex.checked;
    mime_header = document.rewrite.mime_header.value;
    mime_body = document.rewrite.mime_body.value;
    base64 = $('input[ type = "radio" ][ name = "type" ]:checked').val() === 'binary';
    data = document.rewrite.data.value;
    if (id.length === 0) {
      return global.app.config.add(title, url, url_is_regex, mime_header, mime_body, base64, data, function(success, rewrite) {
        enable_form();
        if (success) {
          set_status_message('success', '保存が完了しました');
          add_rewrite_list(rewrite);
          clear_form();
          return send_changed_message();
        } else {
          return set_status_message('failed', '保存に失敗しました');
        }
      });
    } else {
      return global.app.config.override(id, title, url, url_is_regex, mime_header, mime_body, base64, data, function(success, rewrite) {
        enable_form();
        if (success) {
          set_status_message('success', '書き換え設定を上書きしました');
          $("#rewrite-" + rewrite.id).text(rewrite.title);
          clear_form();
          return send_changed_message();
        } else {
          return set_status_message('failed', '上書きに失敗しました');
        }
      });
    }
  };

  send_changed_message = function() {
    global.recentry_changed = (new Date).getTime();
    return chrome.extension.sendMessage({
      changed: global.recentry_changed
    });
  };

  add_rewrite_list = function(rewrite) {
    var operation, title;
    title = $("<div id=\"rewrite-" + rewrite.id + "\" class=\"item\">" + rewrite.title + "</div>");
    operation = $("<div class=\"operation\" data-rewrite=\"" + rewrite.id + "\"></div>");
    operation.append('<span data-operation="amend">修正</span>');
    operation.append('<span data-operation="remove">削除</span>');
    $('#rewrite-list').append(title);
    $('#rewrite-list').append(operation);
    title.click(clicked_rewrite_list_item);
    operation.children('span[ data-operation = "remove" ]').click(clicked_rewrite_remove);
    return operation.children('span[ data-operation = "amend" ]').click(clicked_rewrite_amend);
  };

  set_status_message = function(class_name, message, show) {
    $('span#status-message').removeClass('waiting success failed').addClass(class_name).text(message);
    if (!(show != null) || show === true) {
      return $('span#status-message').show();
    }
  };

  validation_form = function() {
    var valid_mime;
    if (document.rewrite.title.value.length === 0) {
      set_status_message('failed', 'タイトルを入力してください');
      return false;
    }
    if (document.rewrite.url.value.length === 0) {
      set_status_message('failed', '対象URLを入力してください');
      return false;
    }
    valid_mime = /^[a-zA-Z0-9\.\-]+$/;
    if (!document.rewrite.mime_header.value.match(valid_mime || !document.rewrite.mime_body.value.match)) {
      set_status_message('failed', 'MIMEタイプは英数字とピリオド,ハイフンで入力してください');
      return false;
    }
    return true;
  };

  get_form_element = function() {
    return [$(document.rewrite.title), $(document.rewrite.url), $(document.rewrite.url_is_regex), $(document.rewrite.mime_header), $(document.rewrite.mime_body), $('input[ type = "radio" ][ name = "type" ]'), $(document.rewrite.data), $(document.rewrite.cancel), $(document.rewrite.save)];
  };

  disable_form = function() {
    var element, _i, _len, _ref, _results;
    _ref = get_form_element();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      _results.push(element.attr('disabled', 'disabled'));
    }
    return _results;
  };

  enable_form = function() {
    var element, _i, _len, _ref, _results;
    _ref = get_form_element();
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      element = _ref[_i];
      _results.push(element.removeAttr('disabled'));
    }
    return _results;
  };

  clear_form = function() {
    $('#edit h2').text('新規作成');
    document.rewrite.id.value = '';
    document.rewrite.title.value = '';
    document.rewrite.url.value = '';
    document.rewrite.url_is_regex.checked = false;
    document.rewrite.mime_header.value = '';
    document.rewrite.mime_body.value = '';
    $('input[ type = "radio" ][ name = "type" ]').val(['text']);
    return document.rewrite.data.value = '';
  };

  ready = function() {
    var rewrite, _i, _len, _ref, _results;
    chrome.extension.onMessage.addListener(function(message) {
      if ((message.changed != null) && parseInt(message.changed) !== global.recentry_changed) {
        return location.reload();
      }
    });
    if (global.app.setup_failed) {
      return $('#foreground-view h3').text('拡張機能のセットアップに失敗しました。ブラウザを再起動すると解決する場合があります。');
    } else {
      $('#foreground-view').hide();
      _ref = global.app.config.get_rewrites();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rewrite = _ref[_i];
        _results.push(add_rewrite_list(rewrite));
      }
      return _results;
    }
  };

  $(function() {
    $('#tabs div.tab').click(clicked_tab);
    $('#file-drop-area').bind('dragover', function() {
      return false;
    });
    $('#file-drop-area').bind('dragenter', dragenter);
    $('#file-drop-area').bind('dragleave', dragleave);
    $('#file-drop-area').bind('drop', drop);
    $(document.rewrite.cancel).click(clear_form);
    $(document.rewrite.save).click(clicked_save);
    return chrome.runtime.getBackgroundPage(function(bkg) {
      var timer;
      global.app = bkg.app;
      if (global.app.is_ready) {
        return ready();
      } else {
        $('#foreground-view h3').text('拡張機能をロードしています');
        $('#foreground-view').show();
        return timer = setInterval(function() {
          if (global.app.is_ready) {
            clearInterval(timer);
            return ready;
          }
        }, 100);
      }
    });
  });

}).call(this);
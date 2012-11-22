// Generated by CoffeeScript 1.4.0
(function() {
  var config, global;

  global = this;

  config = (function() {

    config.prototype._create_id = function() {
      var id;
      id = Math.floor(Math.random() * 1000000);
      while (this._get_rewrite(id) !== null) {
        id = Math.floor(Math.random() * 1000000);
      }
      return id;
    };

    config.prototype._get_rewrite = function(id) {
      var index;
      if ((index = this._get_rewrite_index(id)) !== -1) {
        return this._config.rewrite[index];
      } else {
        return null;
      }
    };

    config.prototype._get_rewrite_index = function(id) {
      var i, rewrite, _i, _len, _ref;
      _ref = this._config.rewrite;
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        rewrite = _ref[i];
        if (rewrite.id === id) {
          return i;
        }
      }
      return -1;
    };

    config.prototype._write_config = function(callback) {
      var _this = this;
      return chrome.storage.local.set({
        version: this._version,
        app: this._config
      }, function() {
        return callback.call(_this, !(chrome.runtime.lastError != null));
      });
    };

    config.prototype._read_data = function(callback) {
      var id, id_array, property, rewrite,
        _this = this;
      if (this._config.rewrite.length === 0) {
        return callback.call(this, true);
      } else {
        id_array = (function() {
          var _i, _len, _ref, _results;
          _ref = this._config.rewrite;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            rewrite = _ref[_i];
            _results.push(rewrite.id);
          }
          return _results;
        }).call(this);
        id = id_array.shift();
        property = "data_" + id;
        return chrome.storage.local.get(property, function(data) {
          if (chrome.runtime.lastError != null) {
            return callback.call(_this, false);
          } else {
            _this._data[property] = data[property];
            if ((id = id_array.shift()) != null) {
              property = "data_" + id;
              return chrome.storage.local.get(property, arguments.callee);
            } else {
              return callback.call(_this, true);
            }
          }
        });
      }
    };

    function config(callback) {
      var _this = this;
      this._version = chrome.runtime.getManifest().version;
      this._data = {};
      this._config = {
        disabled_all: false,
        rewrite: []
      };
      chrome.storage.local.get(["version", "app"], function(saved) {
        if (chrome.runtime.lastError != null) {
          return callback.call(_this, false);
        } else {
          if (!(saved.version != null)) {
            return _this._write_config(callback);
          } else if (saved.version !== _this._version) {

          } else {
            _this._config = saved.app;
            return _this._read_data(callback);
          }
        }
      });
    }

    config.prototype.get_rewrite = function(id) {
      return this._get_rewrite(id);
    };

    config.prototype.get_rewrites = function() {
      return this._config.rewrite;
    };

    config.prototype.get_data = function(id) {
      if (this._data["data_" + id] != null) {
        return this._data["data_" + id];
      } else {
        return null;
      }
    };

    config.prototype.add = function(title, url, url_is_regex, mime_header, mime_body, base64, data, callback) {
      var id, set_data, valid_mime,
        _this = this;
      valid_mime = /^[a-zA-Z\.\-]+$/;
      if (!mime_header.match(valid_mime || !mime_body.match(valid_mime))) {
        callback.call(this, false, null);
      }
      id = this._create_id();
      this._config.rewrite.push({
        id: id,
        title: title,
        url: url,
        url_is_regex: url_is_regex,
        mime_header: mime_header,
        mime_body: mime_body,
        base64: base64,
        disabled: false
      });
      set_data = {
        app: this._config
      };
      set_data["data_" + id] = data;
      return chrome.storage.local.set(set_data, function() {
        if (chrome.runtime.lastError != null) {
          _this._config.rewrite.pop();
          return callback.call(_this, false, null);
        } else {
          _this._data["data_" + id] = data;
          return callback.call(_this, true, _this._config.rewrite[_this._config.rewrite.length - 1]);
        }
      });
    };

    config.prototype.remove = function(id, callback) {
      var index, removed,
        _this = this;
      if ((index = this._get_rewrite_index(id)) === -1) {
        callback.call(this, false, null);
      }
      removed = this._config.rewrite[index];
      this._config.rewrite.splice(index, 1);
      return chrome.storage.local.set({
        app: this._config
      }, function() {
        if (chrome.runtime.lastError != null) {
          _this._config.rewrite.splice(index, 0, removed);
          return callback.call(_this, false, null);
        } else {
          return chrome.storage.local.remove("data_" + removed.id, function() {
            _this._data["data_" + removed.id] = void 0;
            return callback.call(_this, true, removed);
          });
        }
      });
    };

    config.prototype.override = function(id, title, url, url_is_regex, mime_header, mime_body, base64, data, callback) {
      var backup, index, set_data,
        _this = this;
      if ((index = this._get_rewrite_index(parseInt(id))) === -1) {
        callback.call(this, false, null);
      }
      backup = this._config.rewrite[index];
      this._config.rewrite[index] = {
        id: backup.id,
        title: title,
        url: url,
        url_is_regex: url_is_regex,
        mime_header: mime_header,
        mime_body: mime_body,
        base64: base64,
        disabled: backup.disabled
      };
      set_data = {
        app: this._config
      };
      set_data["data_" + backup.id] = data;
      return chrome.storage.local.set(set_data, function() {
        if (chrome.runtime.lastError != null) {
          _this._config.rewrite[index] = backup;
          return callback.call(_this, false, null);
        } else {
          _this._data["data_" + backup.id] = data;
          return callback.call(_this, true, _this._config.rewrite[index]);
        }
      });
    };

    config.prototype.disabled_all = function() {
      return this._config.disabled_all;
    };

    config.prototype.set_disabled_all = function(boolean, callback) {
      var _this = this;
      this._config.disabled_all = boolean;
      return chrome.storage.local.set({
        app: this._config
      }, function() {
        if (chrome.runtime.lastError != null) {
          return callback.call(_this, false);
        } else {
          return callback.call(_this, true);
        }
      });
    };

    config.prototype.disabled = function(id, boolean, callback) {
      var backup, index,
        _this = this;
      if ((index = this._get_rewrite_index(id)) === null) {
        callback.call(this, false, null);
      }
      backup = this._config.rewrite[index].disabled;
      this._config.rewrite[index].disabled = boolean;
      return chrome.storage.local.set({
        app: this._config
      }, function() {
        if (chrome.runtime.lastError != null) {
          _this._config.rewrite[index].disabled = backup;
          return callback.call(_this, false, _this._config.rewrite[index]);
        } else {
          return callback.call(_this, true, _this._config.rewrite[index]);
        }
      });
    };

    return config;

  })();

  global.config = config;

}).call(this);

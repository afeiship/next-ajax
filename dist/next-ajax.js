/*!
 * name: next-ajax
 * url: https://github.com/afeiship/next-ajax
 * version: 1.0.0
 * date: 2019-08-31T15:51:15.522Z
 * license: MIT
 */

(function() {
  var global = global || this || window || Function('return this')();
  var nx = global.nx || require('next-js-core2');
  var NxXhr = nx.Xhr || require('next-xhr');
  var NxJson = nx.json || require('next-json');
  var nxParam = nx.param || require('next-param');
  var nxContentType = nx.contentType || require('next-content-type');
  var nxCapitalize = nx.capitalize || require('next-capitalize');
  var NxDataTransform = nx.DataTransform || require('next-data-transform');
  var CONTENT_TYPE = 'Content-Type';
  var DEFAULT_OPTIONS = {
    async: true,
    timeout: 3000,
    contentType: 'json',
    headers: {},
    onRequest: nx.noop,
    onResponse: nx.noop,
    onSuccess: nx.noop,
    onError: nx.noop,
    onComplete: nx.noop,
    onTimeout: nx.noop
  };

  var NxAjax = nx.declare('nx.Ajax', {
    properties: {
      success: {
        get: function() {
          var xhr = this.xhr;
          try {
            return (
              (!xhr.status && location.protocol == 'file:') ||
              (xhr.status >= 200 && xhr.status < 300) ||
              xhr.status == 304 ||
              (navigator.userAgent.indexOf('Safari') > -1 && typeof xhr.status == 'undefined')
            );
          } catch (_) {}
          return false;
        }
      },
      url: {
        get: function() {
          var method = this.method;
          var url = this.url;
          return method === 'GET'
            ? url + (url.indexOf('?') > -1 ? '&' : '?') + nxParam(this.data)
            : url;
        }
      },
      data: function() {
        var method = this.method;
        return method === 'GET' ? this.data : null;
      }
    },
    methods: {
      init: function(inMethod, inUrl, inData, inOptions) {
        this.method = (inMethod || 'GET').toUpperCase();
        this.url = inUrl;
        this.data = inData;
        this.options = nx.mix(null, DEFAULT_OPTIONS, inOptions);
        this.xhr = NxXhr.create();
      },
      onIntercept: function(inAction) {
        var action = 'on' + nxCapitalize(inAction);
        inOptions[action]({
          xhr: this.xhr,
          method: this.method,
          url: this.url,
          xhr: this.data,
          options: this.options
        });
      },
      onStateChange: function() {
        var options = this.options;
        if (this.success) {
          this.onIntercept('response');
          options.onSuccess(this.result('success'));
        } else {
          options.onFail(this.result('fail'));
        }
        options.onComplete(this.result('complete'));
      },
      onResult: function(inStatus, inResult) {
        var contentType = this.options.contentType;
        var xhr = this.xhr;
        return {
          status: inStatus || 'unknown',
          code: inResult.code,
          data: NxDataTransform[contentType](xhr.responseText),
          xhr: xhr
        };
      },
      result: function(inStatus) {
        var res = { code: -1 };
        switch (inStatus) {
          case 'success':
            res = { code: 0 };
            break;
          case 'fail':
            res = { code: 1 };
            break;
          case 'timeout':
            res = { code: 2 };
            break;
          case 'complete':
            res = { code: 3 };
            break;
          default:
            res = { code: -1 };
            break;
        }
        return this.onResult(inStatus, res);
      },
      setContentType: function() {
        var contentType = this.options.contentType;
        this.xhr.setRequestHeader(CONTENT_TYPE, nxContentType(contentType));
      },
      setHeaders: function() {
        var headers = this.options.headers;
        nx.forIn(
          headers,
          function(key, value) {
            this.xhr.setRequestHeader(key, value);
          },
          this
        );
      },
      request: function() {
        var isTimeout = false;
        var isComplete = false;
        var options = this.options;
        var xhr = this.xhr;
        var self = this;

        xhr.onreadystatechange = function() {
          if (xhr.readyState == 4) {
            if (!isTimeout) {
              self.onStateChange();
            }
            isComplete = true;
          }
        };

        // open and send:
        xhr.open(this.method, this.url, this.options.async);
        this.onIntercept('request');
        this.setContentType();
        this.setHeaders();
        xhr.send(this.data);

        // set timeout handler:
        this._timer && clearTimeout(this._timer);
        this._timer = global.setTimeout(function() {
          if (!isComplete) {
            isTimeout = true;
            options.onTimeout(self.result('timeout'));
            options.onComplete(self.result('complete'));
          }
        }, options.timeout);
      }
    }
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NxAjax;
  }
})();

//# sourceMappingURL=next-ajax.js.map

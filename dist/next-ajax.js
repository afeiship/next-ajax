/*!
 * name: next-ajax
 * url: https://github.com/afeiship/next-ajax
 * version: 1.0.0
 * date: 2019-09-08T14:25:40.949Z
 * license: MIT
 */

(function() {
  var global = global || this || window || Function('return this')();
  var nx = global.nx || require('next-js-core2');
  var NxXhr = nx.Xhr || require('next-xhr');
  var nxParam = nx.param || require('next-param');
  var nxCapitalize = nx.capitalize || require('next-capitalize');
  var nxDefaults = nx.defaults || require('next-defaults');
  var NxDataTransform = nx.DataTransform || require('next-data-transform');
  var NxXhrHeader = nx.XhrHeader || require('next-xhr-header');
  var RETURN_DATA = function(inValue) { return inValue && inValue.data; };
  var RETURN_VALUE = function(inValue) { return inValue; };
  var STATUS = {
    success: 0,
    fail: 1,
    timeout: 2,
    /** some codesgs backup */
    complete: 10
  };
  var DEFAULT_OPTIONS = {
    async: true,
    timeout: 3000,
    contentType: 'json',
    headers: {},
    onRequest: RETURN_DATA,
    onResponse: RETURN_VALUE,
    onSuccess: nx.noop,
    onFail: nx.noop,
    onComplete: nx.noop,
    onTimeout: nx.noop
  };

  var NxAjax = nx.declare('nx.Ajax', {
    statics: {
      STATUS: STATUS,
      fetch: function(inMethod, inUrl, inData, inOptions) {
        var instance = new NxAjax(inMethod, inUrl, inData, inOptions);
        instance.fetch();
        return instance;
      }
    },
    properties: {
      $success: {
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
      $url: {
        get: function() {
          var method = this.method;
          var url = this.url;
          return method === 'GET'
            ? url + (url.indexOf('?') > -1 ? '&' : '?') + nxParam(this.data)
            : url;
        }
      },
      $data: {
        get: function() {
          var method = this.method;
          var contentType = this.options.contentType;
          var data = NxDataTransform[contentType](this.data);
          return method === 'GET' ? data : null;
        }
      }
    },
    methods: {
      init: function(inMethod, inUrl, inData, inOptions) {
        this.method = (inMethod || 'GET').toUpperCase();
        this.data = inData;
        this.url = inUrl;
        this.options = nx.mix(null, DEFAULT_OPTIONS, inOptions);
        this.xhr = NxXhr.create();
        this.header = new NxXhrHeader(this.xhr);
      },
      destroy: function() {
        this.xhr.abort();
        this.xhr.onreadystatechange = null;
      },
      fetch: function(inOptions) {
        var isTimeout = false;
        var isComplete = false;
        var options = nx.mix(this.options, inOptions);
        var contentType = options.contentType;
        var xhr = this.xhr;
        var headers = nx.mix({ 'Content-Type': contentType }, options.headers);
        var self = this;
        var timer = null;
        var action;
        var body;

        //1. attache listener:
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (!isTimeout) {
              action = self.$success ? 'success' : 'fail';
              options['on' + nxCapitalize(action)](self.response(action));
              options.onComplete(self.response('complete'));
            }
            isComplete = true;
          }
        };

        //2. open and send:
        xhr.open(this.method, this.$url, this.options.async);
        this.header = { request: headers };
        body = this.request();
        xhr.send(body);

        //3. set timeout handler:
        timer && clearTimeout(timer);
        timer = global.setTimeout(function() {
          if (!isComplete) {
            isTimeout = true;
            options.onTimeout(self.response('timeout'));
            options.onComplete(self.response('complete'));
          }
        }, options.timeout);
      },
      response: function(inStatus) {
        var xhr = this.xhr;
        var options = this.options;
        var code = nxDefaults(STATUS[inStatus], -1);
        return options.onResponse({
          status: inStatus,
          code: code,
          data: xhr.responseText,
          xhr: xhr
        });
      },
      request: function() {
        var options = this.options;
        return options.onRequest({
          xhr: this.xhr,
          method: this.method,
          url: this.$url,
          data: this.$data,
          options: options
        });
      }
    }
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NxAjax;
  }
})();

//# sourceMappingURL=next-ajax.js.map

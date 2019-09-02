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
  var STATUS_CODE = {
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
      fetch: function() {
        var isTimeout = false;
        var isComplete = false;
        var options = this.options;
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
              options['on' + nxCapitalize(action)](self.onResponse(action));
              options.onComplete(self.onResponse('complete'));
            }
            isComplete = true;
          }
        };

        //2. open and send:
        xhr.open(this.method, this.$url, this.options.async);
        this.header = { request: headers };
        body = this.onRequest();
        xhr.send(body);

        //3. set timeout handler:
        timer && clearTimeout(timer);
        timer = global.setTimeout(function() {
          if (!isComplete) {
            isTimeout = true;
            options.onTimeout(self.onResponse('timeout'));
            options.onComplete(self.onResponse('complete'));
          }
        }, options.timeout);
      },
      onResponse: function(inStatus) {
        var xhr = this.xhr;
        var options = this.options;
        return options.onResponse({
          status: inStatus,
          code: nxDefaults(STATUS_CODE[inStatus], -1),
          data: xhr.responseText,
          xhr: xhr
        });
      },
      onRequest: function() {
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

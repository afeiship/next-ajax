(function() {
  var global = global || this || window || Function('return this')();
  var nx = global.nx || require('next-js-core2');
  var NxXhr = nx.Xhr || require('next-xhr');
  var NxJson = nx.json || require('next-json');
  var nxParam = nx.param || require('next-param');
  var DEFAULT_OPTIONS = {
    async: true,
    timeout: 3000,
    headers: {},
    onRequest: nx.noop,
    onResponse: nx.noop,
    onSuccess: nx.noop,
    onError: nx.noop,
    onComplete: nx.noop,
    onTimeout: nx.noop
  };

  var NxAjax = nx.declare('nx.Ajax', {
    methods: {
      isSuccess: function(inResponse) {
        try {
          return (
            (!inResponse.status && location.protocol == 'file:') ||
            (inResponse.status >= 200 && inResponse.status < 300) ||
            inResponse.status == 304 ||
            (navigator.userAgent.indexOf('Safari') > -1 && typeof inResponse.status == 'undefined')
          );
        } catch (_) {}
        return false;
      },
      onRequest: function(inMethod, inUrl, inData, inOptions) {
        this.onRequest({
          xhr: this.xhr,
          method: inMethod,
          url: inUrl,
          data: inData,
          options: inOptions
        });
      },
      setHeaders: function(inOptions) {
        var headers = inOptions.headers;
      },
      query: function(inMethod, inUrl, inData, inOptions) {
        var url = inUrl + (inUrl.indexOf('?') > -1 ? '&' : '?') + nxParam(inData);
        httpRequest.open(inMethod, url, inOptions.async);
        this.onRequest(inMethod, inUrl, inData, inOptions);
        this.setHeaders();
        httpRequest.send();
      },
      body: function(inMethod, inUrl, inData, inOptions) {
        httpRequest.open(inMethod, inUrl, inOptions.async);
        this.onRequest(inMethod, inUrl, inData, inOptions);
        this.setHeaders();
        httpRequest.send(inData);
      },
      request: function(inMethod, inUrl, inData, inOptions) {
        var isTimeout = false;
        var isComplete = false;
        var options = nx.mix(null, DEFAULT_OPTIONS, inOptions);
        var timeout = options.timeout;
        var httpRequest = NxXhr.create();
        var method = (inMethod || 'GET').toUpperCase();
        var action = method === 'GET' ? 'query' : 'body';

        httpRequest.onreadystatechange = function() {
          if (httpRequest.readyState == 4) {
            if (!isTimeout) {
              if (this.isSuccess(httpRequest)) {
                options.onSuccess({ code: 0, data: httpRequest });
              } else {
                options.onFail({ code: 1, data: httpRequest });
              }
              options.onComplete({ code: -1, data: httpRequest });
            }
            isComplete = true;
            httpRequest = null;
          }
        };

        // open and send
        this[action](method, inUrl, inData, options);

        this._timer && clearTimeout(this._timer);
        this._timer = global.setTimeout(function() {
          if (!isComplete) {
            isTimeout = true;
            options.onTimeout({ code: 2, data: httpRequest });
            options.onComplete({ code: -1, data: httpRequest });
            clearTimeout(this._timer);
          }
        }, timeout);

        return httpRequest;
      }
    }
  });

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NxAjax;
  }
})();

(function() {
  var nx = require('next-js-core2');
  var NxAjax = require('../src/next-ajax');
  var http = new NxAjax();

  describe('static api', function() {
    it('should have request method helpers', function() {
      expect(typeof http.request).toEqual('function');
      expect(typeof http.get).toEqual('function');
      expect(typeof http.post).toEqual('function');
      // generate:
      expect(typeof http.put).toEqual('function');
      expect(typeof http.patch).toEqual('function');
      expect(typeof http.options).toEqual('function');
      expect(typeof http.head).toEqual('function');
    });
  });
})();

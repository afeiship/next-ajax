(function() {
  var nx = require('next-js-core2');
  var NxAjax = require('../src/next-ajax');

  describe('static api', function() {
    test('should have request method helpers', function() {
      var http = new NxAjax();
      expect(typeof http.request).toEqual('function');
    });
    test.only('test get requst', function() {
      new NxAjax('get', 'https://api.github.com/users/afeiship', null, {
        onSuccess: function(res) {
          console.log(res);
        },
        onComplete: function(res) {
          console.log('res', res);
        },
        onError: function(res) {
          console.log('res', res);
        }
      });
    });
  });
})();

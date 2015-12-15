(function() {

  angular.module('amdusias', ['ngRoute'], function config($httpProvider) {
      $httpProvider.interceptors.push('AuthInterceptor');
  });

})();

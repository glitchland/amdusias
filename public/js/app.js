(function() {

  angular.module('amdusias', ['ngRoute', 'pageslide-directive'], function config($httpProvider) {
      $httpProvider.interceptors.push('AuthInterceptor');
  });

})();

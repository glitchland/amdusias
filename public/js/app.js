(function() {

  angular.module('amdusias', ['ngRoute', 'pageslide-directive', 'luegg.directives'], function config($httpProvider) {
      $httpProvider.interceptors.push('AuthInterceptor');
  });

})();

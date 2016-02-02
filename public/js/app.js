(function() {

  angular.module('amdusias', ['ngRoute', 'pageslide-directive',
                              'luegg.directives', 'youtube-embed'], function config($httpProvider) {
      $httpProvider.interceptors.push('AuthInterceptor');
  });

})();

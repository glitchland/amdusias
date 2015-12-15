(function() {

  angular.module('amdusias')
  .directive('loginPanel', function (UserFactory){

    return{
      restrict: 'E',
      templateUrl: 'partials/index-main.html',
      controller: function(UserFactory) {

        var auth = this;

        // assignment
        auth.login = login;
        auth.logout = logout;

        // initialization
        UserFactory.getUser().then(function(response) {
          auth.user = response.data;
        });

        // View Model functions
        function login(username, password) {
          UserFactory.login(username, password).then(function(response) {
            auth.user = response.data.user;
          }, handleError);
        }

        function logout() {
          auth.user = null;
          UserFactory.logout();
        }

        // UTIL FUNCTIONS
        function handleError(response) {
          alert('Error: ' + response.data);
        }
      },
      controllerAs: 'loginCtrl'
    };

  });

})();

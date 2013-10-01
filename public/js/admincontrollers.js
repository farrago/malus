'use strict';

function AdminUsersCtrl($scope, $rootScope, $location, AdminUser) {
  //
  // Refresh
  //
  $scope.refreshAll = function () {
    if ($rootScope.currentUser.admin) {
      $scope.users = AdminUser.query();
    } else {
      $location.path("/");
    }
  };
  $scope.refreshAll();
};
AdminUsersCtrl.$inject = ['$scope', '$rootScope', '$location', 'AdminUser'];

function AdminUserCtrl($scope, $rootScope, $location, $routeParams, AdminUser) {
  $scope.userId = null;
  $scope.initFromRoute = function () {
    $scope.userId = $routeParams.id;
    $scope.refreshAll();
  }

  //
  // Refresh
  //
  $scope.refreshAll = function () {
    if (($routeParams.id == $rootScope.currentUser.id) || $rootScope.currentUser.admin) {
      //
      // Get the current user
      //
      $scope.user = AdminUser.get({ userId: $scope.userId });
    } else {
      $location.path("/");
    }
  };

  $scope.update = function () {
    if ( ($scope.user && $scope.user.id == $rootScope.currentUser.id) || $rootScope.currentUser.admin) {
      $scope.user.password = $scope.password;
      console.log("User", $scope.user);
      $scope.user.$save();
    }
  }
};
AdminUserCtrl.$inject = ['$scope', '$rootScope', '$location', '$routeParams', 'AdminUser'];

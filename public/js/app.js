'use strict';


// Declare app level module which depends on filters, and services
angular.module(
  'myApp',
  [
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'ui.bootstrap',
  'characterServices',
  'myApp.statsServices',
  'myApp.skillsServices',
  'myApp.woundsServices',
  'myApp.rangedServices',
  'myApp.extPortsServices',
  'myApp.ammosServices',
  'myApp.meleeServices',
  'myApp.areaEffectServices',
  'myApp.equipmentServices',
  'myApp.armourServices',
  ]).
  config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', { templateUrl: 'partials/front.html', controller: MyCtrl2 });
    $routeProvider.when('/characters', { templateUrl: 'partials/characters.html', controller: CharactersCtrl });
    $routeProvider.when('/characters/:id', { templateUrl: 'partials/character.html', controller: CharacterCtrl });
    $routeProvider.otherwise({ redirectTo: '/' });
  }]);

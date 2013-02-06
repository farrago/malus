'use strict';


// Declare app level module which depends on filters, and services
angular.module(
  'myApp',
  [
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'map.directives',
  'map.filters',
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
  'myApp.armourSetServices',
  'myApp.armourPieceServices',
  'myApp.accountServices',
  'myApp.magicItemsServices',
  'myApp.effectsServices',
  'map.systemsServices',
  ]).
  config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/', { templateUrl: 'partials/front.html', controller: MyCtrl2 });
    $routeProvider.when('/map', { templateUrl: 'partials/map.html', controller: MapCtrl });
    $routeProvider.when('/characters', { templateUrl: 'partials/characters.html', controller: CharactersCtrl });
    $routeProvider.when('/characters/:id', { templateUrl: 'partials/character.html', controller: CharacterCtrl });
    $routeProvider.otherwise({ redirectTo: '/' });
  }]);

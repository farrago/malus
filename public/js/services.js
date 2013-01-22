'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');

//
// Character services module
//
angular.module('characterServices', ['ngResource']).
  factory('Character', function ($resource) {
    return $resource('characters/:characterId', { characterId: '@id' }, {});
  });

//
// Character stats module
//
angular.module('myApp.statsServices', ['ngResource']).
  factory('CharacterStats', function ($resource) {
    return $resource('stats/:statId', { statId: '@id' }, {});
  });

//
// Character skills module
//
angular.module('myApp.skillsServices', ['ngResource']).
  factory('CharacterSkill', function ($resource) {
    return $resource('skills/:skillId', { skillId: '@id' }, {});
  });

//
// Character wounds module
//
angular.module('myApp.woundsServices', ['ngResource']).
  factory('CharacterWound', function ($resource) {
    return $resource('wounds/:woundId', { woundId: '@id' }, {});
  });

//
// Character weapons modules
//
angular.module('myApp.rangedServices', ['ngResource']).
  factory('CharacterRanged', function ($resource) {
    return $resource('ranged/:rangedId', { rangedId: '@id' }, {});
  });
angular.module('myApp.extPortsServices', ['ngResource']).
  factory('CharacterExtPort', function ($resource) {
    return $resource('extports/:id', { id: '@id' }, {});
  });
angular.module('myApp.ammosServices', ['ngResource']).
  factory('CharacterAmmo', function ($resource) {
    return $resource('ammos/:id', { id: '@id' }, {});
  });
angular.module('myApp.meleeServices', ['ngResource']).
  factory('CharacterMelee', function ($resource) {
    return $resource('melee/:id', { id: '@id' }, {});
  });
angular.module('myApp.areaEffectServices', ['ngResource']).
  factory('CharacterAreaEffect', function ($resource) {
    return $resource('areaeffect/:id', { id: '@id' }, {});
  });

//
// Character equipment modules
//
angular.module('myApp.equipmentServices', ['ngResource']).
  factory('CharacterEquipment', function ($resource) {
    return $resource('equipment/:id', { id: '@id' }, {});
  });

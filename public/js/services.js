'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp.services', []).
  value('version', '0.1');

//
// Users services
//
angular.module('myApp.userServices', ['ngResource']).
  factory('User', function ($resource) {
    return $resource('users/:id', { id: '@id' }, {});
  });

//
// Map services
//
angular.module('map.systemsServices', ['ngResource']).
  factory('System', function ($resource) {
    return $resource('systems/:id', { id: '@id' }, {});
  });

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

angular.module('myApp.effectsServices', ['ngResource']).
  factory('CharacterEffect', function ($resource) {
    return $resource('effects/:id', { id: '@id' }, {});
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
angular.module('myApp.armourSetServices', ['ngResource']).
  factory('CharacterArmourSet', function ($resource) {
    return $resource('armourset/:id', { id: '@id' }, {});
  });
angular.module('myApp.armourPieceServices', ['ngResource']).
  factory('CharacterArmourPiece', function ($resource) {
    return $resource('armourpiece/:id', { id: '@id' }, {});
  });

angular.module('myApp.magicItemsServices', ['ngResource']).
  factory('CharacterMagicItem', function ($resource) {
    return $resource('magicitems/:id', { id: '@id' }, {});
  });

//
// Character accounts modules
//
angular.module('myApp.accountServices', ['ngResource']).
  factory('CharacterAccount', function ($resource) {
    return $resource('accounts/:id', { id: '@id' }, {});
  });

//
// Parties
//
angular.module('party.partyServices', ['ngResource']).
  factory('Party', function ($resource) {
    return $resource('parties/:id', { id: '@id' }, {});
  });

//
// Notes
//
angular.module('myApp.noteServices', ['ngResource']).
  factory('Note', function($resource) {
      return $resource('notes/:id', { id: '@id' }, {});
  });

//
// Admin
//
angular.module('admin.userServices', ['ngResource']).
  factory('AdminUser', function ($resource) {
    return $resource('users/:userId', { userId: '@id' }, {});
  });



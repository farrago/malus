'use strict';

/* Controllers */


function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];

function LoginCtrl( $scope, $rootScope ) {
  function getMe() {
    dpd.users.me(function (user, error) {
        $rootScope.currentUser = user;
        $scope.$apply();
    });
  }
  getMe();


  $scope.login = function () {
    dpd.users.login({
      username: $scope.username,
      password: $scope.password
    }, function (session, error) {
      if (error) {
        alert(error.message);
      } else {
        getMe();

        $scope.$apply();
      }
    });
  };

  $scope.logout = function () {
    dpd.users.logout(function () {
      $rootScope.currentUser = null;
      $scope.password = null;
      $scope.$apply();
    });
  };

  $scope.register = function () {
    dpd.users.post({
      username: $scope.username,
      password: $scope.password
    }, function (user, error) {
      if (error) {
        alert(JSON.stringify(error));
      } else {
        $rootScope.currentUser = user;
        $scope.$apply();
      }
    });
  };
};
LoginCtrl.$inject = ['$scope', '$rootScope'];

function CharactersCtrl($scope, $routeParams, Character, CharacterStats) {
  //
  // Async updates
  //
  $scope.calls = 0;
  $scope.$watch('calls', function (newValue, oldValue) {
    if (newValue != oldValue && newValue == 0) {
      $scope.refreshAll();
    }
  }, true);

  //
  // Returns appropriate classes for display of objects based on their modification state
  //
  $scope.stateClass = function (obj) {
    if (obj.hasOwnProperty('ui') && obj.ui.add === true) {
      return "state-adding";
    } else if (obj.deleted === true) {
      return "muted state-deleting";
    } else {
      return "";
    }
  }

  $scope.addCharacter = function () {
    var char = new Character();
    char.name = "New Character";
    char.race = "Race";
    char.gender = "Gender";
    char.career = "Career";
    char.age = "Age";
    char.weight = "Weight";
    char.height = "Height";
    char.experience = "0";
    char.caste = "Caste";
    char.deleted = false;
    char.$save({}, function (newChar, saveResponseHeaders) {
      console.log('Added: ', newChar);
      console.log('Adding stats');
      var stats = new CharacterStats();
      stats.characterId = newChar.id;
      stats.iqBase = 0;
      stats.mtBase = 0;
      stats.awBase = 0;
      stats.psBase = 0;
      stats.aBase = 0;
      stats.asBase = 0;
      stats.eBase = 0;
      stats.aibase = 0;
      stats.sBase = 0;
      stats.dxBase = 0;
      stats.rBase = 0;
      stats.spBase = 0;
      stats.iqUp = 0;
      stats.mtUp = 0;
      stats.awUp = 0;
      stats.psUp = 0;
      stats.aUp = 0;
      stats.asUp = 0;
      stats.eUp = 0;
      stats.aiUp = 0;
      stats.sUp = 0;
      stats.dxUp = 0;
      stats.rUp = 0;
      stats.spUp = 0;
      stats.$save({}, function (stats, saveResponseHeaders) {
        console.log('Added stats to: ', newChar);
        console.log('Done adding char');
        $scope.characters.push(newChar);
      });
    });
  };

  $scope.deleteCharacter = function (char) {
    //
    // We don't really delete the character, we just set the 
    // deleted flag on them and mark them modifed
    //
    char.deleted = true;
    if (char.hasOwnProperty('ui')) {
      char.ui.edit = true;
    } else {
      char.ui = function () { };
      char.ui.edit = true;
    }
  }
  $scope.restoreCharacter = function (char) {
    //
    // This takes the deleted flag off, and marks
    // them for saving
    //
    char.deleted = false;
    if (char.hasOwnProperty('ui')) {
      char.ui.edit = true;
    } else {
      char.ui = function () { };
      char.ui.edit = true;
    }
  }

  $scope.filterDeleted = function (char) {
    return $scope.editable || !char.deleted;
  };

  //
  // Generic saving/syncing function.
  // It depends on the ui.xyz parameters added to the object
  //
  $scope.sync = function (obj) {
    if (!obj.hasOwnProperty('ui')) {
      return;
    }

    if (obj.ui.add === true) {
      //
      // Marked for adding so add
      //
      console.log('Adding:', obj);
      delete obj.ui;
      $scope.calls += 1;
      obj.$save({}, function (s, saveResponseHeaders) {
        console.log('Added: ', obj);
        $scope.calls -= 1;
      });
    } else if (obj.ui.delete === true) {
      //
      // Marked for deletion so delete
      //
      console.log('Not Deleting!', obj);
    } else if (obj.ui.edit === true) {
      //
      // Marked as edited, so save
      //
      console.log("Saving:", obj);
      delete obj.ui;
      $scope.calls += 1;
      obj.$save({}, function (s, saveResponseHeaders) {
        console.log("Saved:", s);
        $scope.calls -= 1;
      });
    }
  }

  //
  // Function to save changes to the server
  //
  $scope.endEdit = function () {
    $scope.editable = false;

    //
    // Sync everything
    //
    angular.forEach($scope.characters, function (char) {
      $scope.sync(char);
    });
  }

  //
  // Cancel editing
  //
  $scope.cancelEdit = function () {
    console.log("Edit cancelled");
    $scope.editable = false;
    $scope.refreshAll();
  }

  //
  // Refresh
  //
  $scope.refreshAll = function () {
    $scope.characters = Character.query();
  };
  $scope.refreshAll();

};
CharactersCtrl.$inject = ['$scope', '$routeParams', 'Character', 'CharacterStats'];

//-----------------------------------------------------------------------------------------------------
// 
// ChracterCtrl:   Controller for the single character page
//
//------------------------------------------------------------------------------------------------------
function CharacterCtrl(
  $scope,
  $routeParams,
  Character,
  CharacterStats,
  CharacterSkill,
  CharacterWound,
  CharacterRanged,
  CharacterExtPort,
  CharacterAmmo,
  CharacterMelee,
  CharacterAreaEffect,
  CharacterEquipment,
  CharacterArmour
  ) {

  $scope.editable = false;
  $scope.calls = 0;
  $scope.$watch('calls', function (newValue, oldValue) {
    if (newValue != oldValue && newValue == 0) {
      $scope.refreshAll();
    }
  }, true);

  //
  // Returns appropriate classes for display of objects based on their modification state
  //
  $scope.stateClass = function (obj) {
    if (!obj.hasOwnProperty('ui')) {
      return "";
    }

    var classString = "";
    if (obj.ui.add === true) {
      classString += "state-adding";
    }
    if (obj.ui.delete === true) {
      classString += " muted state-deleting";
    }

    return classString;
  }

  //
  // Generic saving/syncing function.
  // It depends on the ui.xyz parameters added to the object
  //
  $scope.sync = function (obj) {
    if (!obj.hasOwnProperty('ui')) {
      return;
    }

    if (obj.ui.add && obj.ui.delete) {
      //
      // Added then deleted so just remove (but force a refresh
      //
      $scope.refreshNeeded = true;
      return;
    }

    if (obj.ui.add === true) {
      //
      // Marked for adding so add
      //
      console.log('Adding:', obj);
      delete obj.ui;
      $scope.calls += 1;
      obj.$save({}, function (s, saveResponseHeaders) {
        console.log('Added: ', obj);
        $scope.calls -= 1;
      });
    } else if (obj.ui.delete === true) {
      //
      // Marked for deletion so delete
      //
      console.log('Deleting:', obj);
      $scope.calls += 1;
      obj.$delete({ id: obj.id }, function (s, saveResponseHeaders) {
        console.log('Deleted: ', obj);
        $scope.calls -= 1;
      });
    } else if (obj.ui.edit === true) {
      //
      // Marked as edited, so save
      //
      console.log("Saving:", obj);
      delete obj.ui;
      $scope.calls += 1;
      obj.$save({}, function (s, saveResponseHeaders) {
        console.log("Saved:", s);
        $scope.calls -= 1;
      });
    }
  }

  //
  // Enable the edit controls and reset the edit flags
  //
  $scope.allowEdit = function () {
    $scope.editable = true;
  }

  //
  // Function to save changes to the server
  //
  $scope.endEdit = function () {
    $scope.editable = false;
    $scope.calls = 0;
    $scope.refreshNeeded = false;
    
    //
    // Sync everything
    //
    $scope.sync($scope.character);
    $scope.sync($scope.stats);
    angular.forEach($scope.skills, function (skill) {
      $scope.sync(skill);
    });
    angular.forEach($scope.wounds, function (wound) {
      $scope.sync(wound);
    });
    angular.forEach($scope.rangedList, function (ranged) {
      $scope.sync(ranged);
      angular.forEach(ranged.extports, function (extport) {
        $scope.sync(extport);
      });
      angular.forEach(ranged.ammos, function (ammo) {
        $scope.sync(ammo);
      });
    });

    angular.forEach($scope.meleeList, function (melee) {
      $scope.sync(melee);
    });
    angular.forEach($scope.areaEffectList, function (aoe) {
      $scope.sync(aoe);
    });

    angular.forEach($scope.equipmentList, function (equipment) {
      $scope.sync(equipment);
    });

    angular.forEach($scope.armourList, function (armour) {
      $scope.sync(armour);
    });


    if ($scope.refreshNeeded === true && $scope.calls === 0) {
      $scope.refreshAll();
    }

    $scope.refreshNeeded = false;
  }

  //
  // Cancel editing
  //
  $scope.cancelEdit = function () {
    console.log("Edit cancelled");
    $scope.editable = false;
    $scope.refreshAll();
  }

  //
  // Skills
  //
  $scope.refreshSkills = function () {
    $scope.skills = CharacterSkill.query({ characterId: $routeParams.id });
  };

  $scope.addSkill = function () {
    var skill = new CharacterSkill();
    skill.characterId = $routeParams.id;
    skill.name = "New Skill";
    skill.level = 1;
    skill.ui = function () { };
    skill.ui.add = true;
    $scope.skills.push(skill);
  }

  //
  // Wounds
  //
  $scope.refreshWounds = function () {
    //
    // Load the wounds, then do some maths on the results
    //
    $scope.wounds = CharacterWound.query({ characterId: $routeParams.id },
      function (wlist) {
        $scope.wounds.totalDamage = 0;
        $scope.wounds.anyCritical = false;

        angular.forEach(wlist, function (wound, key) {
          $scope.wounds.totalDamage += wound.damage;
          if (wound.critical) {
            $scope.wounds.anyCritical = true;
          }
        })

        $scope.stats.eTmp = $scope.stats.eUp - $scope.wounds.totalDamage;
      });
  };

  $scope.addWound = function () {
    var wound = new CharacterWound();
    wound.characterId = $routeParams.id;
    wound.note = "Note";
    wound.damage = 1;
    wound.location = 1;
    wound.critical = false;
    wound.ui = function () { };
    wound.ui.add = true;
    $scope.wounds.push(wound);
  }

  //
  // Ranged weapons
  //
  $scope.refreshRanged = function () {
    $scope.rangedList = CharacterRanged.query({ characterId: $routeParams.id },
      function (rlist) {
        //
        // Need to change the related items into resources
        //
        angular.forEach(rlist, function (ranged, key) {
          // Ext Ports
          var copyExtports = ranged.extports;
          ranged.extports = [];
          angular.forEach(copyExtports, function (item) {
            var resourceExtport = new CharacterExtPort(item);
            ranged.extports.push(resourceExtport);
          });
          // Ammo
          var copyAmmos = ranged.ammos;
          ranged.ammos = [];
          angular.forEach(copyAmmos, function (item) {
            ranged.ammos.push(new CharacterAmmo( item ));
          })
        })
      }
    );
  };

  $scope.addRanged = function () {
    var ranged = new CharacterRanged();
    ranged.characterId = $routeParams.id;
    ranged.name = "New Weapon";
    ranged.strength = "1";
    ranged.damage = "1D6";
    ranged.short = "1";
    ranged.medium = "1";
    ranged.long = "1";
    ranged.con="1";
    ranged.ports="0";
    ranged.rof="1";
    ranged.enc="";
    ranged.extPorts = [];
    ranged.ui = function () { };
    ranged.ui.add = true;
    $scope.rangedList.push(ranged);
  }

  $scope.addExtPort = function( ranged ) {
    var extport = new CharacterExtPort();
    extport.rangedId = ranged.id;
    extport.name = "New item";
    extport.effect = "Effect";
    extport.ui = function () { };
    extport.ui.add = true;
    ranged.extports.push(extport);
  }

  $scope.addAmmo = function (ranged) {
    var ammo = new CharacterAmmo();
    ammo.rangedId = ranged.id;
    ammo.name = "New Ammo";
    ammo.notes = "Notes";
    ammo.count = "0";
    ammo.ui = function () { };
    ammo.ui.add = true;
    ranged.ammos.push(ammo);
  }

  //
  // Melee weapons
  //
  $scope.refreshMelees = function () {
    $scope.meleeList = CharacterMelee.query({ characterId: $routeParams.id });
  };

  $scope.addMelee = function () {
    var melee = new CharacterMelee();
    melee.characterId = $routeParams.id;
    melee.name = "New Weapon";
    melee.notes = "Notes";
    melee.strength = "1";
    melee.damage = "1";
    melee.as = "0";
    melee.dx = "0";
    melee.c = "0";
    melee.end = "0";

    melee.ui = function () { };
    melee.ui.add = true;
    $scope.meleeList.push(melee);
  }

  //
  // AoE weapons
  //
  $scope.refreshAreaEffects = function () {
    $scope.areaEffectList = CharacterAreaEffect.query({ characterId: $routeParams.id });
  };

  $scope.addAreaEffect = function () {
    var areaEffect = new CharacterAreaEffect();
    areaEffect.characterId = $routeParams.id;
    areaEffect.name = "New Weapon";
    areaEffect.notes = "Notes";
    areaEffect.strength = "1";
    areaEffect.damage = "1";
    areaEffect.area = "1";
    areaEffect.hits = "1";
    areaEffect.number = "0";
    areaEffect.enc = "0";

    areaEffect.ui = function () { };
    areaEffect.ui.add = true;
    $scope.areaEffectList.push(areaEffect);
  }

  //
  // Equipment
  //
  $scope.refreshEquipment = function () {
    $scope.equipmentList = CharacterEquipment.query({ characterId: $routeParams.id });
  };

  $scope.addEquipment = function (carried) {
    var equipment = new CharacterEquipment();
    equipment.characterId = $routeParams.id;
    equipment.name = "New Equipment";
    equipment.count = "1";
    equipment.carried = carried;

    equipment.ui = function () { };
    equipment.ui.add = true;
    $scope.equipmentList.push(equipment);
  }

  //
  // Armour
  //
  $scope.refreshArmour = function () {
    $scope.armourList = CharacterArmour.query({ characterId: $routeParams.id });
  };

  $scope.addArmour = function (carried) {
    var armour = new CharacterArmour();
    armour.characterId = $routeParams.id;
    armour.name = "New Armour";
    armour.location = "1";
    armour.cBase = "1";
    armour.cUp = "1";
    armour.cCurrent = "1";
    armour.c = "1";
    armour.notes = "notes";

    armour.ui = function () { };
    armour.ui.add = true;
    $scope.armourList.push(armour);
  }

  //
  // Function to reload all of the character
  //
  $scope.refreshAll = function () {
    $scope.character = Character.get({ id: $routeParams.id });

    //
    // Bit of a cheat to query the stats by characterId then take the first response
    // as the stats for this character (should never have multiple stats anyway)
    //
    $scope.statsList = CharacterStats.query({ characterId: $routeParams.id },
      function (sList, respHeaders) {
        $scope.stats = sList[0];
      });

    $scope.refreshSkills();
    $scope.refreshWounds();
    $scope.refreshRanged();
    $scope.refreshMelees();
    $scope.refreshAreaEffects();
    $scope.refreshEquipment();
    $scope.refreshArmour();
  }
  $scope.refreshAll();

};
CharacterCtrl.$inject = [
  '$scope',
  '$routeParams',
  'Character',
  'CharacterStats',
  'CharacterSkill',
  'CharacterWound',
  'CharacterRanged',
  'CharacterExtPort',
  'CharacterAmmo',
  'CharacterMelee',
  'CharacterAreaEffect',
  'CharacterEquipment',
  'CharacterArmour',
];

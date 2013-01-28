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
  CharacterEffect,
  CharacterWound,
  CharacterRanged,
  CharacterExtPort,
  CharacterAmmo,
  CharacterMelee,
  CharacterAreaEffect,
  CharacterEquipment,
  CharacterArmourSet,
  CharacterArmourPiece,
  CharacterAccount,
  CharacterMagicItem
  ) {

  $scope.editable = false;
  $scope.calls = 0;
  $scope.$watch('calls', function (newValue, oldValue) {
    if (newValue != oldValue && newValue == 0) {
      $scope.refreshAll();
    }
  }, true);

  //
  // Outstanding reads / refreshing handling
  //
  $scope.outstandingReads = 0;
  $scope.maxReads = 0;
  $scope.progress = "0%";
  $scope.incrementOutstanding = function () {
    $scope.outstandingReads += 1;
    $scope.maxReads = Math.max($scope.maxReads, $scope.outstandingReads);
    $scope.progress = "0%";
  };
  $scope.decrementOutstanding = function () {
    if ($scope.outstandingReads === 0) {
      console.log("Too many read completions!!");
    }
    $scope.outstandingReads -= 1;
    var progress = ($scope.maxReads - $scope.outstandingReads) / $scope.maxReads;
    progress = Math.floor(progress * 100);
    $scope.progress = progress + "%";
  };

  $scope.$watch('outstandingReads', function (newValue, oldValue) {
    if (newValue != oldValue && newValue == 0) {
      $scope.calculateTemporaries();
    }
  }, true);

  $scope.calculateTemporaries = function () {
    //
    // Check that the objects exist
    //
    if (!$scope.hasOwnProperty('stats')) {
      console.log("No Stats", $scope);
      return;
    }
    if (!$scope.hasOwnProperty('effects')) {
      console.log("No effects", $scope);
      return;
    }
    if (!Array.isArray($scope.effects)) {
      console.log("Effects are not an array");
      return;
    };

    //
    // Build an array of all the current values
    //
    var stats = ['iq', 'aw', 'mt', 'ps', 'a', 'e', 's', 'r', 'as', 'ai', 'dx', 'sp'];
    $scope.tmpStats = [];
    var suffix = 'Up';

    //
    // Get the "upgraded" values for all stats
    //
    angular.forEach(stats, function (value) {
      var tmpName = value + suffix;
      $scope.tmpStats[value] = $scope.stats[tmpName];
    });

    //
    // Iterate through the effects, applying them if possible
    //
    angular.forEach($scope.effects, function (value) {
      var statLowercase = value.stat.toLowerCase();
      var effectNumber = Number(value.effect);
      if ($scope.tmpStats.hasOwnProperty(statLowercase) && !isNaN(effectNumber)) {
        $scope.tmpStats[statLowercase] += effectNumber;
      } else {
        console.log("Couldn't apply", value);
        console.log("Value", effectNumber);
      }
    });

    //
    // Now iterate through the wounds, applying them to Endurance
    //
    angular.forEach($scope.wounds, function (value) {
      var damageNumber = Number(value.damage);
      if (!isNaN(damageNumber)) {
        $scope.tmpStats['e'] -= damageNumber;
      } else {
        console.log("Couldn't apply", value);
        console.log("Value", damageNumber);
      }
    });

    //
    // Finally, iterate through all the temp values, and if they
    // haven't changed then set then back to ""
    //
    angular.forEach(stats, function (value) {
      var tmpName = value + suffix;
      if ($scope.tmpStats[value] == $scope.stats[tmpName]) {
        $scope.tmpStats[value] = "";
      }
    });
  };

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

  $scope.syncArray = function (arr) {
    angular.forEach(arr, function (item) {
      $scope.sync(item);
    });
  };

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
    $scope.syncArray($scope.skills);
    $scope.syncArray($scope.wounds);
    $scope.syncArray($scope.effects);
    $scope.syncArray($scope.meleeList);
    $scope.syncArray($scope.areaEffectList);
    $scope.syncArray($scope.equipmentList);
    $scope.syncArray($scope.magicItemList);
    $scope.syncArray($scope.accountList);

    angular.forEach($scope.rangedList, function (ranged) {
      $scope.sync(ranged);
      $scope.syncArray(ranged.extports);
      $scope.syncArray(ranged.ammos);
    });

    angular.forEach($scope.armourSetList, function (armour) {
      $scope.sync(armour);
      $scope.syncArray(armour.pieces);
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
    $scope.incrementOutstanding();
    $scope.skills = CharacterSkill.query({ characterId: $routeParams.id }, function (slist) {
      $scope.decrementOutstanding();
    });
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
    $scope.incrementOutstanding();
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
        });
        $scope.decrementOutstanding();
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
  // Effects
  //
  $scope.refreshEffects = function () {
    $scope.incrementOutstanding();
    $scope.effects = CharacterEffect.query({ characterId: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
  };

  $scope.addEffect = function () {
    var effect = new CharacterEffect();
    effect.characterId = $routeParams.id;
    effect.notes = "Description";
    effect.stat = "Stat";
    effect.effect = "-1";
    effect.ui = function () { };
    effect.ui.add = true;
    $scope.effects.push(effect);
  }

  //
  // Ranged weapons
  //
  $scope.refreshRanged = function () {
    $scope.incrementOutstanding();
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
        $scope.decrementOutstanding();
      });
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
    $scope.incrementOutstanding();
    $scope.meleeList = CharacterMelee.query({ characterId: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
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
    $scope.incrementOutstanding();
    $scope.areaEffectList = CharacterAreaEffect.query({ characterId: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
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
    $scope.incrementOutstanding();
    $scope.equipmentList = CharacterEquipment.query({ characterId: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
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
  // ArmourSet
  //
  $scope.refreshArmourSets = function () {
    $scope.incrementOutstanding();
    $scope.armourSetList = CharacterArmourSet.query({ characterId: $routeParams.id },
      function (rlist) {
        //
        // Need to change the related items into resources
        //
        angular.forEach(rlist, function (armourSet, key) {
          // Pieces of the set
          var copyPieces = armourSet.pieces;
          armourSet.pieces = [];
          angular.forEach(copyPieces, function (item) {
            var resourcePiece = new CharacterArmourPiece(item);
            armourSet.pieces.push(resourcePiece);
          });
        })
        $scope.decrementOutstanding();
      });
  };

  $scope.addArmourSet = function () {
    var armourSet = new CharacterArmourSet();
    armourSet.characterId = $routeParams.id;
    
    armourSet.$save({}, function (s, saveResponseHeaders) {
      console.log("Saved:", s);
      armourSet.id = s.id;
      
      armourSet.name = "New Armour";
      armourSet.notes = "Notes";
      armourSet.pieces = [];

      armourSet.ui = function () { };
      armourSet.ui.add = true;
      
      $scope.armourSetList.push(armourSet);

      for (var i = 1; i <= 8; ++i) {
        var piece = new CharacterArmourPiece();
        piece.armoursetId = armourSet.id;
        piece.location = String(i);
        piece.baseCondition = "1";
        piece.currentCondition = "1";
        piece.notes = "Notes";
        piece.owned = false;
        piece.ui = function () { };
        piece.ui.add = true;

        armourSet.pieces.push(piece);
      }

      var piece = new CharacterArmourPiece();
      piece.armoursetId = armourSet.id;
      piece.location = "All";
      piece.baseCondition = "1";
      piece.currentCondition = "1";
      piece.notes = "Notes";
      piece.owned = false;
      piece.ui = function () { };
      piece.ui.add = true;

      armourSet.pieces.push(piece);
    });
  }

  $scope.pieceFilter = function (piece) {
    return $scope.editable || (piece.baseCondition !== null && piece.baseCondition !== "");
  };

  //
  // MagicItems
  //
  $scope.refreshMagicItems = function () {
    $scope.incrementOutstanding();
    $scope.magicItemList = CharacterMagicItem.query({ characterId: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
  };

  $scope.addMagicItem = function (carried) {
    var magicItem = new CharacterMagicItem();
    magicItem.characterId = $routeParams.id;
    magicItem.name = "New Item";
    magicItem.uses = "0";
    magicItem.notes = "notes";

    magicItem.ui = function () { };
    magicItem.ui.add = true;
    $scope.magicItemList.push(magicItem);
  }

  //
  // Accounts
  //
  $scope.refreshAccounts = function () {
    $scope.incrementOutstanding();
    $scope.accountList = CharacterAccount.query({ characterId: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
  };

  $scope.addAccount = function (carried) {
    var account = new CharacterAccount();
    account.characterId = $routeParams.id;
    account.name = "New Account";
    account.balance = "0";
    account.notes = "notes";

    account.ui = function () { };
    account.ui.add = true;
    $scope.accountList.push(account);
  }

  //
  // Function to reload all of the character
  //
  $scope.refreshCharacter = function () {
    $scope.incrementOutstanding();
    $scope.character = Character.get({ id: $routeParams.id }, function () {
      $scope.decrementOutstanding();
    });
  };

  $scope.refreshStats = function () {
    $scope.incrementOutstanding();
    //
    // Bit of a cheat to query the stats by characterId then take the first response
    // as the stats for this character (should never have multiple stats anyway)
    //
    $scope.statsList = CharacterStats.query({ characterId: $routeParams.id },
      function (sList, respHeaders) {
        $scope.stats = sList[0];
        $scope.decrementOutstanding();
      });
  };
  $scope.refreshAll = function () {
    if ($scope.outstandingReads !== 0) {
      console.log("Refreshing with outstanding reads!");
    }
    $scope.outstandingReads = 0;

    $scope.refreshCharacter();
    $scope.refreshStats();
    $scope.refreshSkills();
    $scope.refreshEffects();
    $scope.refreshWounds();
    $scope.refreshRanged();
    $scope.refreshMelees();
    $scope.refreshAreaEffects();
    $scope.refreshEquipment();
    $scope.refreshArmourSets();
    $scope.refreshMagicItems();
    $scope.refreshAccounts();
  }
  $scope.refreshAll();

};
CharacterCtrl.$inject = [
  '$scope',
  '$routeParams',
  'Character',
  'CharacterStats',
  'CharacterSkill',
  'CharacterEffect',
  'CharacterWound',
  'CharacterRanged',
  'CharacterExtPort',
  'CharacterAmmo',
  'CharacterMelee',
  'CharacterAreaEffect',
  'CharacterEquipment',
  'CharacterArmourSet',
  'CharacterArmourPiece',
  'CharacterAccount',
  'CharacterMagicItem',
];

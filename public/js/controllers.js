'use strict';

/* Controllers */
var myApp = angular.module('myApp');


function MyCtrl1() {}
MyCtrl1.$inject = [];


function MyCtrl2() {
}
MyCtrl2.$inject = [];

myApp.controller('LoginCtrl',  ['$scope', '$rootScope', '$location', '$window', function( $scope, $rootScope, $location, $window ) {
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
        // Reload the page
        $window.location.reload();
      }
    });
  };

  $scope.logout = function () {
    dpd.users.logout(function () {
      $rootScope.currentUser = null;
      $scope.password = null;
      $location.path("/");
      $window.location.reload();
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
}]);
//LoginCtrl.$inject = ['$scope', '$rootScope', '$location', '$window'];

myApp.controller('CharactersCtrl', CharactersCtrl);
function CharactersCtrl($scope, $routeParams, $location, Character, CharacterStats) {
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
    char.$save({}, function (newChar, saveResponseHeaders) {
      console.log('Added: ', newChar);
      console.log('Adding stats');
      var stats = new CharacterStats();
      stats.characterId = newChar.id;
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
    if ( $scope.currentUser ) {
      $scope.characters = Character.query({ creatorId: $scope.currentUser.id });
    } else {
      $location.path("/");
    }
  };
  $scope.refreshAll();

};
CharactersCtrl.$inject = ['$scope', '$routeParams', '$location', 'Character', 'CharacterStats'];

//-----------------------------------------------------------------------------------------------------
// 
// ChracterCtrl:   Controller for the single character page
//
//------------------------------------------------------------------------------------------------------
myApp.controller('CharacterCtrl', CharacterCtrl);
function CharacterCtrl(
  $scope,
  $routeParams,
  $location,
  $dialog,
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

    //
    // Core id
    //
    $scope.characterId = null;
    $scope.initFromRoute = function () {
        console.log("Initialising Id from route params", $routeParams.id);
        $scope.characterId = $routeParams.id;
        $scope.refreshAll();
    }
    $scope.initFromId = function (id) {
        console.log("Initialising Id from function parameter", id);
        $scope.characterId = id;
        $scope.refreshAll();
    }
    $scope.initFromData = function (char) {
        if (char) {
            $scope.characterId = char.id;
            $scope.processCharObject(char);
        }
    }

    $scope.$watch('selection.char', function (newVal, oldVal) {
        if (newVal) {
            $scope.initFromData(newVal);
        }
    });

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
        console.log("Incremented outstanding, now:", $scope.outstandingReads);
    };
    $scope.decrementOutstanding = function () {
        if ($scope.outstandingReads === 0) {
            console.log("Too many read completions!!");
        }
        $scope.outstandingReads -= 1;
        var progress = ($scope.maxReads - $scope.outstandingReads) / $scope.maxReads;
        progress = Math.floor(progress * 100);
        $scope.progress = progress + "%";

        console.log("Decremented outstanding, now:", $scope.outstandingReads);
    };

    $scope.$watch('outstandingReads', function (newValue, oldValue) {
        console.log('Outstanding reads changed:', newValue, oldValue);
        if (newValue != oldValue && newValue == 0) {
            $scope.calculateTemporaries();
        }
    });

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
        $scope.tmpStats = {};
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
        // Now handle wounds, applying them to Endurance
        //
        $scope.updateWoundTotals($scope.wounds);
        if (!isNaN($scope.wounds.totalDamage)) {
            $scope.tmpStats['e'] -= $scope.wounds.totalDamage;
        }

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
        $scope.character.tmpStats = $scope.tmpStats;
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

    $scope.markEdited = function (item) {
        if (!item.hasOwnProperty('ui')) {
            item.ui = function () { };
        }
        item.ui.edit = true;
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
        $scope.skills = CharacterSkill.query({ characterId: $scope.characterId }, function (slist) {
            $scope.decrementOutstanding();
        });
    };

    $scope.addSkill = function () {
        var skill = new CharacterSkill();
        skill.characterId = $scope.characterId;
        skill.name = "New Skill";
        skill.level = 1;
        skill.ui = function () { };
        skill.ui.add = true;
        $scope.skills.push(skill);
    }

    //
    // Wounds
    //
    $scope.updateWoundTotals = function (wounds) {
        $scope.wounds.totalDamage = 0;
        $scope.wounds.anyCritical = false;

        angular.forEach(wounds, function (wound, key) {
            if (!isNaN(wound.damage)) {
                $scope.wounds.totalDamage += wound.damage;
                if (wound.critical) {
                    $scope.wounds.anyCritical = true;
                }
            }
        });
    }
    $scope.addWound = function () {
        var wound = new CharacterWound();
        wound.characterId = $scope.characterId;
        wound.note = "Note";
        wound.damage = 1;
        wound.location = 1;
        wound.critical = false;
        wound.ui = function () { };
        wound.ui.add = true;
        $scope.wounds.push(wound);
    }

    $scope.wform = {};
    $scope.addWoundFromForm = function () {
        if ($scope.wform.note && $scope.wform.damage && $scope.wform.location) {
            var wound = new CharacterWound();
            wound.characterId = $scope.characterId;
            wound.note = $scope.wform.note;
            wound.damage = $scope.wform.damage;
            wound.location = $scope.wform.location;
            wound.critical = $scope.wform.critical;

            wound.$save();
            $scope.wounds.push(wound);
            $scope.calculateTemporaries();

            $scope.wform.note = "";
            $scope.wform.damage = "";
            $scope.wform.location = "";
            $scope.wform.critical = false;

        } else {
            console.log("Missing something", $scope.wform);
        }
    }

    $scope.healWound = function (points, wound) {
        var confirmMessage = "";
        if (wound === null) {
            confirmMessage = "Heal all wounds by 1 point?";
        } else {
            confirmMessage = "Heal " + wound.note + " by 1 point?";
        }
        if (!confirm(confirmMessage)) {
            return;
        }

        if (!wound) {
            angular.forEach($scope.wounds, function (wound) {
                if (Number(wound.damage)) {
                    wound.damage = Number(wound.damage) - Number(points);
                    wound.$save();
                }
            });
        } else {
            if (Number(wound.damage)) {
                wound.damage = Number(wound.damage) - Number(points);
                wound.$save();
            }
        }
        $scope.calculateTemporaries();
    }

    //
    // Effects
    //
    $scope.refreshEffects = function () {
        $scope.incrementOutstanding();
        $scope.effects = CharacterEffect.query({ characterId: $scope.characterId }, function () {
            $scope.decrementOutstanding();
        });
    };

    $scope.addEffect = function () {
        var effect = new CharacterEffect();
        effect.characterId = $scope.characterId;
        effect.notes = "Description";
        effect.stat = "Stat";
        effect.effect = "-1";
        effect.ui = function () { };
        effect.ui.add = true;
        $scope.effects.push(effect);
    }
    $scope.eform = {};
    $scope.addEffectFromForm = function () {
        if ($scope.eform.note && $scope.eform.stat && $scope.eform.effect) {
            var effect = new CharacterEffect();
            effect.characterId = $scope.characterId;
            effect.notes = $scope.eform.note;
            effect.stat = $scope.eform.stat;
            effect.effect = $scope.eform.effect;

            effect.$save();
            $scope.effects.push(effect);
            $scope.calculateTemporaries();

            $scope.eform.note = "";
            $scope.eform.stat = "";
            $scope.eform.effect = "";

        } else {
            console.log("Missing something", $scope.eform);
        }
    }

    //
    // Ranged weapons
    //
    $scope.refreshRanged = function () {
        $scope.incrementOutstanding();
        $scope.rangedList = CharacterRanged.query({ characterId: $scope.characterId },
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
                      ranged.ammos.push(new CharacterAmmo(item));
                  })
              })
              $scope.decrementOutstanding();
          });
    };

    $scope.addRanged = function () {
        var ranged = new CharacterRanged();
        ranged.characterId = $scope.characterId;
        ranged.name = "New Weapon";
        ranged.strength = "1";
        ranged.damage = "1D6";
        ranged.short = "1";
        ranged.medium = "1";
        ranged.long = "1";
        ranged.con = "1";
        ranged.ports = "0";
        ranged.rof = "1";
        ranged.enc = "";
        ranged.extPorts = [];
        ranged.ui = function () { };
        ranged.ui.add = true;
        $scope.rangedList.push(ranged);
    }

    $scope.addExtPort = function (ranged) {
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
    // Remove ammo dialog
    //
    $scope.useAmmoDlg = function (ranged) {
        console.log("Use Ammo Dialog called");
        var opts = {
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl: '/partials/sub/use_ammo_dlg.html', // OR: templateUrl: 'path/to/view.html',
            controller: 'UseAmmoDialogController',
            ranged: ranged, // Pass along the object of interest
            loadoutFilter: $scope.editableOrInLoadout,  // Filter function
        };
        var d = $dialog.dialog(opts);
        d.open().then(function (result) {
            if (result) {
                console.log("Used", result.ammo, result.drain);
                var temp = Number(result.ammo.loadout) - result.drain;
                if (temp < 0) {
                    temp = 0;
                }
                result.ammo.loadout = String(temp);
                result.ammo.$save();
            }
        });
    };
    $scope.useAmmo = function (ranged, ammo) {
        var have = Number(ammo.loadout);
        var drain = Number(ranged.drain) || 1;
        if (have < drain) {
            alert("Not enough ammo to fire " + ranged.name + " using " + ammo.name);
            return;
        }

        var confirmMessage = "Fire " + ranged.name + " using " + ammo.name + " [will use " + drain + " of " + have + "]?";
        if (!confirm(confirmMessage)) {
            return;
        }
        ammo.loadout = String(have - drain);
        ammo.$save();
    }

    //
    // Melee weapons
    //
    $scope.refreshMelees = function () {
        $scope.incrementOutstanding();
        $scope.meleeList = CharacterMelee.query({ characterId: $scope.characterId }, function () {
            $scope.decrementOutstanding();
        });
    };

    $scope.addMelee = function () {
        var melee = new CharacterMelee();
        melee.characterId = $scope.characterId;
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
        $scope.areaEffectList = CharacterAreaEffect.query({ characterId: $scope.characterId }, function () {
            $scope.decrementOutstanding();
        });
    };

    $scope.addAreaEffect = function () {
        var areaEffect = new CharacterAreaEffect();
        areaEffect.characterId = $scope.characterId;
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

    $scope.confirmUseAoE = function (aoe) {
        var title = 'Use ' + aoe.name + '?';
        var msg = 'Hit ok to remove one ' + aoe.name + '.';
        var btns = [{ result: 'cancel', label: 'Cancel' }, { result: 'ok', label: 'OK', cssClass: 'btn-primary' }];
        var thisAoE = aoe;

        $dialog.messageBox(title, msg, btns)
          .open()
          .then(function (result) {
              if (result === 'ok') {
                  var temp = Number(thisAoE.loadout) - 1;
                  thisAoE.loadout = String(temp);
                  thisAoE.$save();
              }
          });
    };

    $scope.useAoe = function (aoe) {
        var have = Number(aoe.loadout);
        if (have < 1) {
            alert("No " + aoe.name + " left!");
            return;
        }

        var confirmMessage = "Use " + aoe.name + " [" + have + " left]?";
        if (!confirm(confirmMessage)) {
            return;
        }
        aoe.loadout = String(have - 1);
        aoe.$save();
    }

    //
    // Equipment
    //
    $scope.refreshEquipment = function () {
        $scope.incrementOutstanding();
        $scope.equipmentList = CharacterEquipment.query({ characterId: $scope.characterId }, function () {
            $scope.decrementOutstanding();
        });
    };

    $scope.addEquipment = function (carried) {
        var equipment = new CharacterEquipment();
        equipment.characterId = $scope.characterId;
        equipment.name = "New Equipment";
        equipment.count = "1";
        equipment.carried = carried;

        equipment.ui = function () { };
        equipment.ui.add = true;
        $scope.equipmentList.push(equipment);
    }
    $scope.useEquipment = function (equipment) {
        var have = Number(equipment.loadout);
        if (have < 1) {
            alert("No " + equipment.name + " left!");
            return;
        }

        var confirmMessage = "Use one " + equipment.name + " [" + have + " left]?";
        if (!confirm(confirmMessage)) {
            return;
        }
        equipment.loadout = String(have - 1);
        equipment.$save();
    }

    //
    // ArmourSet
    //
    $scope.refreshArmourSets = function () {
        $scope.incrementOutstanding();
        $scope.armourSetList = CharacterArmourSet.query({ characterId: $scope.characterId },
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
        armourSet.characterId = $scope.characterId;

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

    $scope.damageArmour = function (points, piece) {
        var confirmMessage = "";
        if (piece === null) {
            return;
        } else {
            confirmMessage = "Damage location " + piece.location + " by 1 point?";
        }
        if (!confirm(confirmMessage)) {
            return;
        }

        if (Number(piece.currentCondition)) {
            piece.currentCondition = String(Number(piece.currentCondition) - Number(points));
            piece.$save();
        }
    }

    //
    // MagicItems
    //
    $scope.refreshMagicItems = function () {
        $scope.incrementOutstanding();
        $scope.magicItemList = CharacterMagicItem.query({ characterId: $scope.characterId }, function () {
            $scope.decrementOutstanding();
        });
    };

    $scope.addMagicItem = function (carried) {
        var magicItem = new CharacterMagicItem();
        magicItem.characterId = $scope.characterId;
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
        $scope.accountList = CharacterAccount.query({ characterId: $scope.characterId }, function () {
            $scope.decrementOutstanding();
        });
    };

    $scope.addAccount = function (carried) {
        var account = new CharacterAccount();
        account.characterId = $scope.characterId;
        account.name = "New Account";
        account.balance = "0";
        account.notes = "notes";

        account.ui = function () { };
        account.ui.add = true;
        $scope.accountList.push(account);
    }

    $scope.withdraw = function (account, amount) {
        var newBalance = Number(account.balance) - Number(amount);
        account.balance = String(newBalance);
        account.ui.edit = true;
        if (!account.ui.hasOwnProperty('transactions')) {
            account.ui.transactions = [];
        }
        account.ui.transactions.push("Withdrew " + amount);
        console.log(account.ui.transactions);
    }
    $scope.deposit = function (account, amount) {
        var newBalance = Number(account.balance) + Number(amount);
        account.balance = String(newBalance);
        account.ui.edit = true;
        if (!account.ui.hasOwnProperty('transactions')) {
            account.ui.transactions = [];
        }
        account.ui.transactions.push("Deposited " + amount);
        console.log(account.ui.transactions);
    }

    //
    // Loadout functionality
    //
    $scope.moveAll = function (item, from, to) {
        console.log("Taking all ammo", item, from, to);
        if (!item.hasOwnProperty(from)) {
            console.log("Couldn't use the from");
            return; //Don't mark edited
        } else if (!item[to]) {
            // Empty destination so just copy everything across
            item[to] = item[from];
            item[from] = "0";
        } else if (isNaN(item[to]) || isNaN(item[from])) {
            // Not an empty destination so we would need numbers to do maths
            console.log("Can't do anything with not numbers");
            return; // Don't mark edited
        } else {
            var temp = Number(item[to]) + Number(item[from]);
            item[to] = String(temp);
            item[from] = "0";
        }

        $scope.markEdited(item);
        console.log("Updated:", item);
    };
    // Filter to limit to only loadout items
    $scope.editableOrInLoadout = function (item) {
        if ($scope.editable) {
            return true;
        } else if (!item.loadout) {
            return false;
        } else if (!isNaN(Number(item.loadout))) {
            return Number(item.loadout) > 0;
        } else {
            // Some kind of string
            return true;
        }
    };
    // Filter to limit to only non-loadout items
    $scope.editableOrNotInLoadout = function (item) {
        if ($scope.editable) {
            return true;
        } else if (!item.count) {
            return false;
        } else if (!isNaN(Number(item.count))) {
            return Number(item.count) > 0;
        } else {
            // Some kind of string
            return true;
        }
    };
    // Filter to limit the view if showLoadout is true
    $scope.limitIfShowLoadout = function (item) {
        if ($scope.showLoadout) {
            return $scope.editableOrInLoadout(item);
        }

        return true;
    }

    //
    // Giving functionality
    //
    $scope.give = function (target, object, group) {
        if (!target || !object || !group) {
            return;
        }
        if (target.id === $scope.character.id) {
            alert("Can't give things to yourself!");
            return;
        }
        var confirmMessage = "Do you want to give " + object.name + " to " + target.name + "?";
        if (!confirm(confirmMessage)) {
            return;
        }

        //
        // Update the object
        //
        object.characterId = target.id;
        object.$save();

        //
        // Remove it from our cached data
        //
        for (var i = group.length - 1; i >= 0; i--) {
            if (group[i].id === object.id) {
                group.splice(i, 1);
                break;
            }
        }

        if ($scope.refreshPartyChar) {
            $scope.refreshPartyChar(target.id);
        }
    }

    $scope.giveOneAoe = function (target, object, group) {
        if (!target || !object || !group) {
            return;
        }
        if (target.id === $scope.character.id) {
            alert("Can't give things to yourself!");
            return;
        }
        if (!object.loadout) {
            alert("Don't have any to give!");
            return;
        }
        var confirmMessage = "Do you want to give one " + object.name + " to " + target.name + "?";
        if (!confirm(confirmMessage)) {
            return;
        }

        //
        // Search the target char's aoe list for a matching object. That is one that
        // matches area, damage, hits, strength, and name
        //
        var found = null;
        for (var i = 0, l = target.aoes.length; i < l; ++i) {
            var aoe = target.aoes[i];
            if (
              aoe.area === object.area &&
              aoe.damage === object.damage &&
              aoe.hits === object.hits &&
              aoe.name === object.name &&
              aoe.strength === object.strength
              ) {
                found = aoe;
                break;
            }
        }
        if (!found) {
            found = {};
            found.characterId = target.id;
            found.area = object.area;
            found.damage = object.damage;
            found.hits = object.hits;
            found.name = object.name;
            found.strength = object.strength;
            found.notes = object.notes;
            found.enc = object.enc;
            found.number = "0";
            found.loadout = "0";
        }

        if (!found.$save) {
            found = new CharacterAreaEffect(found);
        }

        //
        // Update the loadout of each objects
        //
        object.loadout = String(Number(object.loadout) - 1);
        object.$save();
        found.loadout = String(Number(found.loadout) + 1);
        found.$save();

        if ($scope.refreshPartyChar) {
            $scope.refreshPartyChar(target.id);
        }
    }

    $scope.giveOneEquipment = function (target, object, group) {
        if (!target || !object || !group) {
            return;
        }
        if (target.id === $scope.character.id) {
            alert("Can't give things to yourself!");
            return;
        }
        if (!object.loadout) {
            alert("Don't have any to give!");
            return;
        }
        var confirmMessage = "Do you want to give one " + object.name + " to " + target.name + "?";
        if (!confirm(confirmMessage)) {
            return;
        }

        //
        // Search the target char's Equipment list for a matching object. That is one that
        // matches the name
        //
        var found = null;
        for (var i = 0, l = target.equipments.length; i < l; ++i) {
            var equipment = target.equipments[i];
            if (equipment.name === object.name) {
                found = equipment;
                break;
            }
        }
        if (!found) {
            found = {};
            found.characterId = target.id;
            found.name = object.name;
            found.count = "0";
            found.loadout = "0";
            found.carried = true;
        }

        if (!found.$save) {
            found = new CharacterEquipment(found);
        }

        //
        // Update the loadout of each objects
        //
        object.loadout = String(Number(object.loadout) - 1);
        object.$save();
        found.loadout = String(Number(found.loadout) + 1);
        found.$save();

        if ($scope.refreshPartyChar) {
            $scope.refreshPartyChar(target.id);
        }
    }

    //
    // Function to reload all of the character
    //
    $scope.processCharObject = function (char) {
        //
        // Base character
        //
        $scope.character = char;

        //
        // Stats
        //
        $scope.stats = new CharacterStats(char.stats);

        //
        // Skills
        //
        $scope.skills = [];
        angular.forEach(char.skills, function (skill, index) {
            $scope.skills.push(new CharacterSkill(skill));
        });

        //
        // Effects
        //
        $scope.effects = [];
        angular.forEach(char.effects, function (effect, index) {
            $scope.effects.push(new CharacterEffect(effect));
        });

        //
        // Wounds
        //
        $scope.wounds = [];
        angular.forEach(char.wounds, function (wound, index) {
            $scope.wounds.push(new CharacterWound(wound));
        });
        $scope.updateWoundTotals($scope.wounds);

        //
        // Ranged
        //
        $scope.rangedList = [];
        angular.forEach(char.ranged, function (rangedItem, index) {
            var ranged = new CharacterRanged(rangedItem);
            // Ext Ports
            ranged.extports = [];
            angular.forEach(rangedItem.extports, function (item) {
                ranged.extports.push(new CharacterExtPort(item));
            });
            // Ammo
            ranged.ammos = [];
            angular.forEach(rangedItem.ammos, function (item) {
                ranged.ammos.push(new CharacterAmmo(item));
            })
            $scope.rangedList.push(ranged);
        });

        //
        // Melee Weapons
        //
        $scope.meleeList = [];
        angular.forEach(char.melees, function (melee, index) {
            $scope.meleeList.push(new CharacterMelee(melee));
        });

        //
        // Area Effect Weapons
        //
        $scope.areaEffectList = [];
        angular.forEach(char.aoes, function (aoe, index) {
            $scope.areaEffectList.push(new CharacterAreaEffect(aoe));
        });

        //
        // Equipment
        //
        $scope.equipmentList = [];
        angular.forEach(char.equipments, function (equipment, index) {
            $scope.equipmentList.push(new CharacterEquipment(equipment));
        });

        //
        // Armour sets
        //
        $scope.armourSetList = [];
        angular.forEach(char.armoursets, function (set, index) {
            var armourSet = new CharacterArmourSet(set);
            // pieces
            armourSet.pieces = [];
            angular.forEach(set.pieces, function (item) {
                armourSet.pieces.push(new CharacterArmourPiece(item));
            });

            $scope.armourSetList.push(armourSet);
        });

        //
        // Magic items
        //
        $scope.magicItemList = [];
        angular.forEach(char.magicitems, function (item, index) {
            $scope.magicItemList.push(new CharacterMagicItem(item));
        });

        //
        // Accounts
        //
        $scope.accountList = [];
        angular.forEach(char.accounts, function (item, index) {
            $scope.accountList.push(new CharacterAccount(item));
        });

        //
        // Calculate the temporaries from this new data
        //
        $scope.calculateTemporaries();
    }
    $scope.refreshCharacter = function () {
        $scope.incrementOutstanding();
        Character.get({ id: $scope.characterId }, function (char, respHeaders) {
            $scope.decrementOutstanding();
            $scope.processCharObject(char);

        }); // End got character data
    };

    $scope.refreshStats = function () {
        $scope.incrementOutstanding();
        //
        // Bit of a cheat to query the stats by characterId then take the first response
        // as the stats for this character (should never have multiple stats anyway)
        //
        $scope.statsList = CharacterStats.query({ characterId: $scope.characterId },
          function (sList, respHeaders) {
              $scope.stats = sList[0];
              $scope.decrementOutstanding();
          });
    };
    $scope.refreshAll = function () {
        if (!$scope.currentUser) {
            $location.path("/");
        }

        if ($scope.outstandingReads !== 0) {
            console.log("Refreshing with outstanding reads!");
        }

        $scope.refreshCharacter();
    }

};
CharacterCtrl.$inject = [
  '$scope',
  '$routeParams',
  '$location',
  '$dialog',
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

//
// Controller for the add wounds dialog
//
function AddWoundsDialogController($scope, dialog) {
  $scope.ok = function (result) {
    console.log('Close called', $scope);
    var data = {
      note: $scope.note,
      damage: $scope.damage,
      location: $scope.location,
      critical: $scope.critical
    };
    dialog.close(data);
  };
  $scope.cancel = function () {
    dialog.close(null);
  }
}

//
// Controller for the use ammo dialog
//
function UseAmmoDialogController($scope, dialog) {
  $scope.ranged = dialog.options.ranged;
  $scope.loadoutFilter = dialog.options.loadoutFilter;
  $scope.drain = Number($scope.ranged.drain);

  $scope.ok = function (result) {
    console.log('Close called', result);
    var data = {
      ammo: result,
      drain: $scope.drain
    };
    dialog.close(data);
  };
  $scope.cancel = function () {
    dialog.close(null);
  }
}
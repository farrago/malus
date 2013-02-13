'use strict';

/* Controllers */


function PartiesCtrl($scope, $routeParams, Party, User) {
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

  $scope.addParty = function () {
    var party = new Party();
    party.name = "New Party";
    party.users = [$scope.currentUser.id];
    party.pcs = [];
    party.npcs = [];
    party.deleted = false;
    party.$save({}, function (newParty, saveResponseHeaders) {
      console.log('Added: ', newParty);
      $scope.parties.push(newParty);
    });
  };

  $scope.deleteParty = function (party) {
    //
    // We don't really delete the partyacter, we just set the 
    // deleted flag on them and mark them modifed
    //
    party.deleted = true;
    if (party.hasOwnProperty('ui')) {
      party.ui.edit = true;
    } else {
      party.ui = function () { };
      party.ui.edit = true;
    }
  }
  $scope.restoreParty = function (party) {
    //
    // This takes the deleted flag off, and marks
    // them for saving
    //
    party.deleted = false;
    if (party.hasOwnProperty('ui')) {
      party.ui.edit = true;
    } else {
      party.ui = function () { };
      party.ui.edit = true;
    }
  }

  $scope.filterDeleted = function (party) {
    return $scope.editable || !party.deleted;
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
    angular.forEach($scope.partyacters, function (party) {
      $scope.sync(party);
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
    if ($scope.currentUser) {
      //
      // Select just the parties I am a member of.
      //
      $scope.parties = Party.query({ users: $scope.currentUser.id });
    } else {
      $location.path("/");
    }
  };
  $scope.refreshAll();

};
PartiesCtrl.$inject = ['$scope', '$routeParams', 'Party'];

//-----------------------------------------------------------------------------------------------------
// 
// PartyCtrl:   Controller for the single party page
//
//------------------------------------------------------------------------------------------------------
function PartyCtrl(
  $scope,
  $routeParams,
  $location,
  $http,
  User,
  Party,
  Character
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
      // Nothing right now
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
    $scope.refreshAvailableChars();
    $scope.refreshAvailableUsers();
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
    $scope.sync($scope.party);
    
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
  // Show loadout or everything
  //
  $scope.showLoadout = true;

  //
  // Functions for adding and removing characters
  //
  $scope.selectedChar = "";
  $scope.refreshAvailableChars = function () {
    $scope.availableChars = [{ name: "Select Character...", id: "" }];
    Character.query({ creatorId: $scope.currentUser.id }, function (chars) {
      angular.forEach(chars, function (char) {
        if ( char.deleted !== true ) {
          $scope.availableChars.push(char);
        }
      });
    });
  };
  $scope.addPC = function (charId) {
    if (!charId) {
      return;
    }
    $scope.party.pcs.push(charId);
    if ( !$scope.party.hasOwnProperty('ui') ) {
      $scope.party.ui = function(){};
    }
    $scope.party.ui.edit = true;
  }
  $scope.addNPC = function (charId) {
    if (!charId) {
      return;
    }
    $scope.party.npcs.push(charId);
    if (!$scope.party.hasOwnProperty('ui')) {
      $scope.party.ui = function () { };
    }
    $scope.party.ui.edit = true;
  }
  $scope.removeChar = function (charId) {
    console.log("Remove Character", charId);
    for (var i = $scope.party.pcs.length - 1; i >= 0; i--) {
      if ($scope.party.pcs[i] == charId) {
        $scope.party.pcs.splice(i, 1);
        break;
      }
    }
    for (var i = $scope.party.npcs.length - 1; i >= 0; i--) {
      if ($scope.party.npcs[i] == charId) {
        $scope.party.npcs.splice(i, 1);
        break;
      }
    }

    if (!$scope.party.hasOwnProperty('ui')) {
      $scope.party.ui = function () { };
    }
    $scope.party.ui.edit = true;
  }

  //
  // Functions for adding and removing players
  //
  $scope.selectedUser = "";
  $scope.refreshAvailableUsers = function () {
    $scope.availableUsers = [{ name: "Select User...", id: "" }];
    User.query({}, function (users) {
      angular.forEach(users, function (user) {
        if (user.deleted !== true) {
          $scope.availableUsers.push(user);
        }
      });
    });
  };
  $scope.addUser = function (userId) {
    if (!userId || ($.inArray(userId, $scope.party.users) !== -1)) {
      return;
    }
    $scope.party.users.push(userId);
    $scope.refreshUsernames($scope.party);

    if (!$scope.party.hasOwnProperty('ui')) {
      $scope.party.ui = function () { };
    }
    $scope.party.ui.edit = true;
  }
  $scope.removeUser = function (userId) {
    console.log("Remove User", userId);
    if ($scope.party.users.length <= 1) {
      return;
    }
    for (var i = $scope.party.users.length - 1; i >= 0; i--) {
      if ($scope.party.users[i] == userId) {
        $scope.party.users.splice(i, 1);
        break;
      }
    }
    $scope.refreshUsernames($scope.party);

    if (!$scope.party.hasOwnProperty('ui')) {
      $scope.party.ui = function () { };
    }
    $scope.party.ui.edit = true;
  }

  $scope.refreshUsernames = function (data) {
    $scope.players = [];

    var queryStr = 'users/?{"id": { "$in": ';
    queryStr += angular.toJson(data.users);
    queryStr += "}}";

    $http.get(queryStr).success(function (data, status) {
      console.log("Data:", data, status);
      $scope.players = data;

      console.log("Final scope", $scope);
    });
  }

  //
  // Function to reload all of the character
  //
  $scope.refreshParty = function () {
    $scope.incrementOutstanding();
    $scope.party = Party.get({ id: $routeParams.id }, function (data, headers) {
      //
      // Get the players info based on the data we got back.
      // Fancy querying is a bit of a pain in the ass!
      //
      $scope.refreshUsernames(data);
      $scope.decrementOutstanding();
    });
  };

  //
  // Refresh all function
  $scope.refreshAll = function () {
    if (!$scope.currentUser) {
      $location.path("/");
    }

    if ($scope.outstandingReads !== 0) {
      console.log("Refreshing with outstanding reads!");
    }
    $scope.outstandingReads = 0;

    $scope.refreshParty();
  }
  $scope.refreshAll();

};
PartyCtrl.$inject = [
  '$scope',
  '$routeParams',
  '$location',
  '$http',
  'User',
  'Party',
  'Character'
];

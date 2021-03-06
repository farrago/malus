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
    party.contacts = [];
    party.deleted = false;
    party.$save({}, function (newParty, saveResponseHeaders) {
      console.log('Added: ', newParty);
      $scope.parties.push(newParty);
    });
  };

  $scope.deleteParty = function (party) {
    //
    // We don't really delete the party, we just set the 
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
    angular.forEach($scope.parties, function (party) {
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
  $timeout,
  User,
  Party,
  Character,
  CharacterStats,
  Note
  ) {


  // Get pings to keep the socket open
  $scope.keepAliveReceived = false;
  $scope.keepAliveRequested = false;
  $scope.keepAliveTimer = null;
  $scope.connected = false;

  $scope.randomDelay = function() { return 40000 + ((Math.random() * 15000) - 5000)};
  $scope.keepAliveDelay = $scope.randomDelay();
  $scope.minMargin = 1000;
  $scope.myTimer = 0;
  $scope.otherTimer = 0;
  $scope.keepAlivePossible = 0;
  $scope.keepAliveSent = 0;

  //
  // When the scope is destroyed, tidy up our dpd socket stuff
  //
  $scope.$on('$destroy', function destroy() {
    // say goodbye to your controller here
    // release resources, cancel request...
    dpd.off('keepalive');
    dpd.off('char:changed');
    dpd.off('party:changed');
    $timeout.cancel($scope.keepAliveTimer);
    console.log("Cancelled keepalives: ", $scope.keepAliveDelay);
  });

  dpd.socketReady(function () {
    var realFunc = function () {
      console.log("Socket ready. Using keepalive of ", $scope.keepAliveDelay);
      $scope.connected = true;
      $scope.keepaliver();
    };
    $scope.$apply(realFunc());
  });

  dpd.on('keepalive', function (data) {
    var realFunc = function () {
      $scope.keepAliveReceived = true;
      $scope.connected = true;
      if (data.query == $scope.keepAliveDelay) {
        $scope.myTimer += 1;
      } else {
        $scope.otherTimer += 1;
        //
        // Check if this is close to my timer and recalc if so
        //
        if (Math.abs(data.query - $scope.keepAliveDelay) < $scope.minMargin) {
          $scope.keepAliveDelay = $scope.randomDelay();
          console.log("=========== Picking new random time ================ ", $scope.keepAliveDelay);
        }
      }
      console.log("keepalive ", $scope.keepAlivePossible, $scope.keepAliveSent, $scope.myTimer, $scope.otherTimer);
      $scope.keepaliver();  // Start the timer for the next one
    };
    $scope.$apply(realFunc());
  });

  // 
  // Stop any current timer and restart it for another 40s
  // Actually add a bit of wiggle room so that various connections likely end up with
  // different times, so only 1 request will be made across all clients.
  //
  $scope.keepaliver = function () {
    $scope.keepAlivePossible += 1;

    $timeout.cancel($scope.keepAliveTimer);

    $scope.keepAliveTimer = $timeout(function () {
      if ($scope.keepAliveRequested && !$scope.keepAliveReceived) {
        $scope.connected = false;
      }

      $scope.keepAliveRequested = true;
      $scope.keepAliveReceived = false;
      $http.get('/keepalive', { params: { id: $scope.keepAliveDelay } }).
        error(function (data, status) {
          console.log("Keepalive call failed!");
          $scope.connected = false;
        });
      $scope.keepAliveSent += 1;
      $scope.keepaliver();
    }, $scope.keepAliveDelay, true);
  };

  //
  // Refresh all the party when we get connected to be sure we are up to date
  //
  $scope.$watch('connected', function (newVal, oldVal) {
    if (newVal && (newVal !== oldVal)) {
      $scope.refreshAll();
    }
  });
  
  $scope.statics = statics;

  $scope.editable = false;
  $scope.calls = 0;

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
      return;
    }
    $scope.outstandingReads -= 1;
    var progress = ($scope.maxReads - $scope.outstandingReads) / $scope.maxReads;
    progress = Math.floor(progress * 100);
    $scope.progress = progress + "%";
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
      var refresh = obj.ui.partyChange;
      delete obj.ui;
      $scope.calls += 1;
      obj.$save({}, function (s, saveResponseHeaders) {
        console.log("Saved:", s);
        $scope.calls -= 1;
        if (refresh && !$scope.connected) {
          $scope.refreshAll();
        }

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
  $scope.editableParty = false;
  $scope.allowEdit = function () {
    $scope.editable = true;
    $scope.editableParty = true;
    $scope.refreshAvailableChars();
    $scope.refreshAvailableUsers();
  }

  //
  // Function to save changes to the server
  //
  $scope.endEdit = function () {
    $scope.editable = false;
    $scope.editableParty = false;
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
    $scope.editableParty = false;
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
  // Watch the selected char and then reload the old char when we change chars
  // to pick up the changed values
  //
  dpd.on('char:changed', function (data) {
    console.log("OnCharChanged: ", data);
    $scope.refreshPartyChar(data);
  });
  $scope.refreshPartyChar = function (charId) {
    if (charId) {
      Character.get({ id: charId }, function (char) {
        var found = false;
        // See if it was a PC
        if ($scope.party && $scope.party.pc_chars) {
          for (var i = 0, l = $scope.party.pc_chars.length; i < l; ++i) {
            if ($scope.party.pc_chars[i].id == char.id) {
              $scope.party.pc_chars[i] = char;
              found = true;
              if (charId === $scope.selection.char.id) {
                $scope.selection.char = $scope.party.pc_chars[i];
              }
              break;
            }
          }
        }
        // See if it was an NPC
        if ($scope.party && $scope.party.npc_chars && !found) {
          for (var i = 0, l = $scope.party.npc_chars.length; i < l; ++i) {
            if ($scope.party.npc_chars[i].id == char.id) {
              $scope.party.npc_chars[i] = char;
              found = true;
              if (charId === $scope.selection.char.id) {
                $scope.selection.char = $scope.party.npc_chars[i];
              }
              break;
            }
          }
        }

        if (!found) {
          console.log("Couldn't find: ", char);
        }
      });
    }
  };
  
  $scope.addToParty = function (charId) {
    console.log("Add to party:", charId);
    var found = false;
    for (var i = $scope.party.contacts.length - 1; i >= 0; i--) {
      if ($scope.party.contacts[i] == charId) {
        found = true;
        $scope.party.contacts.splice(i, 1);
        break;
      }
    }
    if (found) {
      if (!$scope.party.hasOwnProperty('npcs')) {
        $scope.party.npcs = [];
      }
      $scope.party.npcs.push(charId);

      if (!$scope.party.hasOwnProperty('npc_chars')) {
        $scope.party.npc_chars = [];
      }
      for (var i = $scope.party.contact_chars.length - 1; i >= 0; i--) {
        if ($scope.party.contact_chars[i].id == charId) {
          $scope.party.npc_chars.push($scope.party.contact_chars[i]);
          $scope.party.contact_chars.splice(i, 1);
          break;
        }
      }

      if (!$scope.party.hasOwnProperty('ui')) {
        $scope.party.ui = function () { };
      }
      $scope.party.ui.edit = true;
      $scope.party.ui.partyChange = true;
    }
  }

  $scope.removeFromParty = function (charId) {
    console.log("Remove from party:", charId);
    var found = false;
    for (var i = $scope.party.npcs.length - 1; i >= 0; i--) {
      if ($scope.party.npcs[i] == charId) {
        found = true;
        $scope.party.npcs.splice(i, 1);
        break;
      }
    }
    if (found) {
      if (!$scope.party.hasOwnProperty('contacts')) {
        $scope.party.contacts = [];
      }
      $scope.party.contacts.push(charId);

      for (var i = $scope.party.npc_chars.length - 1; i >= 0; i--) {
        if ($scope.party.npc_chars[i].id == charId) {
          $scope.party.contact_chars.push($scope.party.npc_chars[i]);
          $scope.party.npc_chars.splice(i, 1);
          break;
        }
      }

      if (!$scope.party.hasOwnProperty('ui')) {
        $scope.party.ui = function () { };
      }
      $scope.party.ui.edit = true;
      $scope.party.ui.partyChange = true;
    }
  }

  $scope.newContact = {};
  $scope.addNewContact = function () {
    console.log("Adding new contact", $scope.newContact);
    if (!$scope.newContact.name) {
      return;
    }
    var char = new Character();
    char.name = $scope.newContact.name;
    if ($scope.newContact.hasOwnProperty('career')) {
      char.career = $scope.newContact.career;
    }
    if ($scope.newContact.hasOwnProperty('notes')) {
      char.notes = $scope.newContact.notes;
    }
    console.log("Saving contact", char);
    char.$save({}, function (newChar, saveResponseHeaders) {
      console.log('Added: ', newChar);
      console.log('Adding to contacts');

      if (!$scope.party.hasOwnProperty('contacts')) {
        $scope.party.contacts = [];
      }
      $scope.party.contacts.push(newChar.id);
      if (!$scope.party.hasOwnProperty('contact_chars')) {
        $scope.party.contact_chars = [];
      }
      $scope.party.contact_chars.push(newChar);

      if (!$scope.party.hasOwnProperty('ui')) {
        $scope.party.ui = function () { };
      }
      $scope.party.ui.edit = true;
      $scope.party.ui.partyChange = true;

      $scope.newContact = {};
    });
  };

  $scope.newNote = {};
  $scope.addNewNote = function() {
    console.log("Adding new note", $scope.newNote);
    if (!$scope.newNote.note) {
      return;
    }
    var note = new Note();
    note.note = $scope.newNote.note;
    note.partyId = $scope.party.id;
    
    console.log("Saving note", note);
    note.$save({}, function(newNote, saveResponseHeaders) {
      console.log('Added: ', newNote);
      $scope.newNote = {};
    }, function error(responseHeaders) {
      console.log('Failed to save note', responseHeaders);
    });
  };
  dpd.on('party:new-note', function(data) {
    if (data.partyId === $scope.party.id) {
      console.log('Adding to notes', data);

      if (!$scope.party.hasOwnProperty('notes')) {
        $scope.party.notes = [];
      }
      $scope.party.notes.push(data);
    }
  });

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

  //
  // Have to do this horrible thing because you can't have enough nested quotes
  $scope.npcsortid = "stats['eUp']";
  $scope.selection = {
    "char": null,
    "showWoundsEffects": false,
  };

  //
  // Function to reload all of the character
  //
  dpd.on('party:changed', function (data) {
    console.log("OnPartyChanged: ", data);
    if (data == $routeParams.id) {
      $scope.refreshAll();
    }
  });
  $scope.refreshParty = function () {
    console.log("Refresh Party");
    $scope.incrementOutstanding();
    $scope.party = Party.get({ id: $routeParams.id }, function (data, headers) {
      //
      // Get the players info based on the data we got back.
      //
      if (data.pc_chars && data.pc_chars.length > 0) {
        $scope.selection.char = data.pc_chars[0];
      }
      $scope.decrementOutstanding();
    });
  };

  //
  // Refresh all function
  //
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
  '$timeout',
  'User',
  'Party',
  'Character',
  'CharacterStats',
  'Note'
];

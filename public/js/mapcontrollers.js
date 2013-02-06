'use strict';

function MapCtrl($scope, $routeParams, System) {
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
    console.log("Calculate Temporaries called");
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
    $scope.syncArray($scope.systems);
    
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

  $scope.econTypes = statics.economyConv;
  $scope.lawTypes = statics.lawConv;
  

  //
  // Systems
  //
  $scope.refreshSystems = function () {
    $scope.incrementOutstanding();
    $scope.systems = System.query({}, function () {
      $scope.decrementOutstanding();
    });
  };

  $scope.addSystem = function () {
    console.log("addSystemCalled: ", $scope.newsystem);
    var system = new System();
    system.name = $scope.newsystem.name;
    system.x = $scope.newsystem.x;
    system.y = $scope.newsystem.y;
    system.economy = $scope.newsystem.economy;
    system.law = $scope.newsystem.law;

    system.ui = function () { };
    system.ui.add = true;
    $scope.systems.push(system);

    console.log("Systems:", $scope.systems);

    $scope.newsystem.name = null;
    $scope.newsystem.x = null;
    $scope.newsystem.y = null;
    $scope.newsystem.economy = null;
    $scope.newsystem.law = null;

    //
    // Set the focus back
    //
    $('#newsystemname').focus();
    $('html, body').animate({
      scrollTop: $("#newsystemname").offset().top
    }, 1000);
  }

  //
  // Interactivity
  //
  $scope.selectedSystem = "(none)";

  //
  // Refresh all
  //
  $scope.refreshAll = function () {
    if ($scope.outstandingReads !== 0) {
      console.log("Refreshing with outstanding reads!");
    }
    $scope.outstandingReads = 0;

    $scope.refreshSystems();
  }
  $scope.refreshAll();
}
MapCtrl.$inject = [
  '$scope',
  '$routeParams',
  'System'
];
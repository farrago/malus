'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersion', ['version', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  }]).
  directive('contenteditable', function () {
    return {
      require: 'ngModel',
      link: function (scope, elm, attrs, ctrl) {
        //console.log("Scope:", scope, elm, attrs, ctrl );

        // view -> model
        elm.bind('blur', function () {
          scope.$apply(function () {
            ctrl.$setViewValue(elm.text());
          });
          scope.$apply(attrs.onOk);
        });

        // model -> view
        ctrl.$render = function (value) {
          elm.html(ctrl.$modelValue);
        };
      }
    };
  }).
  directive('mlRelativeValue', function () {
    return {
      restrict: 'E',
      template: '<span ng-class="relativeClass">' +
                  '{{bestValue}}' +
                '</span>',
      scope: {
        mlCurrent: '=',
        mlBase: '='
      },
      link: function (scope, elem, attrs) {
        // Function to calculate what to display
        var update = function () {
          scope.relativeClass = "";

          //
          // Set the best value
          //
          scope.bestValue = scope.mlBase;
          if (scope.mlCurrent) {
            scope.bestValue = scope.mlCurrent;

            //
            // Set the class
            //
            if (scope.mlCurrent > scope.mlBase) {
              scope.relativeClass = "label label-success";
            }
            else if (scope.mlCurrent < (scope.mlBase / 2)) {
              scope.relativeClass = "label label-danger";
            }
            else if (scope.mlCurrent < scope.mlBase) {
              scope.relativeClass = "label label-warning";
            }
          }
        };
        
        // Watch the values to update as needed
        scope.$watch('mlCurrent', function (newVal, oldVal) {
          update();
        });
        scope.$watch('mlBase', function (newVal, oldVal) {
            update();
        });
      }
    }
});


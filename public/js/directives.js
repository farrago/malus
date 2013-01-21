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
  });

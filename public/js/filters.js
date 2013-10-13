'use strict';

/* Filters */

angular.module('myApp.filters', []).
  filter('interpolate', ['version', function(version) {
    return function(text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }]).
  filter('shortname', function () {
    return function (fullname) {
      var nicks = String(fullname).match(/"\w*"/);
      if (nicks && nicks.length > 0 ) {
        return nicks[0].slice(1,-1);
      }
      return String(fullname).split(' ')[0];
    }
  })
;

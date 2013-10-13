'use strict';

/* Filters */

angular.module('map.filters', []).
  filter('niceEconomy', function() {
    return function (input) {
      if (statics.economyConv.hasOwnProperty(input)) {
        return statics.economyConv[input];
      } else {
        return "Unknown";
      }
    }
  }).
  filter('niceLaw', function () {
    return function (input) {
      if (statics.lawConv.hasOwnProperty(input)) {
        return statics.lawConv[input];
      } else {
        return "Unknown";
      }
    }
  }).
  filter('location', function () {
    return function (input) {
      if (statics.hitLocations.hasOwnProperty(input)) {
        return statics.hitLocations[input];
      } else {
        return "Unknown";
      }
    }
  });

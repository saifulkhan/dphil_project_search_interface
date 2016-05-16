'use strict';

var enterpriseSearchApp = angular.module('enterpriseSearchApp');


/***************************************************************************************************************
 * Directive
 * Result
 ****************************************************************************************************************/

enterpriseSearchApp.directive('resultprovis', ["$compile", "$window", "$rootScope", function ($compile, $window, $rootScope) {

  var directive = {};
  directive.restrict = 'E';  // restrict this directive to elements

  directive.link = function ($scope, element, attributes) {

    /********************************************************************************************************
     * Handle the new query event
     ********************************************************************************************************/
    $scope.$on('event:saved-result-received', function (event, args) {

      var savedResult = args;
      console.log("event:saved-result-received: ", savedResult, element[0], $rootScope.resultGraphCoordinates);
      processResult(savedResult, element[0], $rootScope.resultGraphCoordinates);
    });

  } // link

  return directive;
}]);

'use strict';


/***************************************************************************************************************
 * Controller: Search provenance
 ***************************************************************************************************************/

var enterpriseSearchApp = angular.module('enterpriseSearchApp');

enterpriseSearchApp.controller('searchspaceController', ["$modal", "$scope", "$http", "$window", "$rootScope",
  function ($modal, $scope, $http, $window, $rootScope) {

    var width = $window.innerWidth - 60;
    var height = $window.innerHeight - 60;

    $rootScope.treemapCoordinates = {
      x: 30,
      y: 30,
      w: width,
      h: height,
    };

    $scope.treemapData = [];

    // Setting attributes for fsglyphs & treemap
    $scope.settingAttributes = {
      type: "",
      size: "",
      date: "",
      time: "",
      depth: "2"
    }


    $scope.searchresult = [];

    /*******************************************************************************************************************
     * Set event listener on local storage
     *******************************************************************************************************************/
    angular.element($window).on('storage', function (event) {

      //alert("W2: localstorage: triggered!");
      $scope.updateResult();
    });


    /***************************************************************************************************************
     * Call treemapBuild only once, when webpage loads firt time
     ****************************************************************************************************************/

    $scope.$on('$viewContentLoaded', function () {
      //alert("Page loaded:");
      $scope.buildTreemap();
    });


    /***************************************************************************************************************
     * treemapbuild : http request to server for the
     * Send: Co-ordinates
     * Receive Json data and then draw treemap
     ****************************************************************************************************************/
    $scope.buildTreemap = function () {
      $http.post('/api/common/buildtreemap', $scope.treemapCoordinates).success(function (response) {

        //response received from server
        if (response.length > 0) {
          $scope.treemapData = response;
          $rootScope.$broadcast('event:treemapbuild-received', $scope.treemapData);
        }
      })
    }


    /***************************************************************************************************************
     * Zoom : http request to server
     * Send: the path to zoom, previous co-ordinate will be there
     * Receive Json data and then draw treemap
     ****************************************************************************************************************/

    $rootScope.zoomTreemap = function (pathArg) {

      var path = {path: pathArg};
      console.log("called zoomTreemap():: path=", path);

      $http.post('/api/common/zoomtreemap', path).success(function (response) {
        //response received from server
        if (response.length > 0) {
          $scope.treemapData = response;
          $rootScope.$broadcast('event:treemapbuild-received', $scope.treemapData);


        }
      })
    }



    /*******************************************************************************************************************
     * Saved Result / portfolio
     *******************************************************************************************************************/
    $scope.updateResult = function () {
      var resdata = $window.localStorage.getItem('new-result');
      if (resdata != null && resdata.length != 0) {
        var rdata = JSON.parse(resdata);
        //console.log("W2::$scope.updateResult::rdata = ", rdata);
        if (rdata != null) {
          $rootScope.$apply();
          $scope.$broadcast('event:searchresult-received', rdata);
        }
        $window.localStorage.removeItem('new-result');
      }
    }

}]); // controller




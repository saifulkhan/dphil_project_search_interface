'use strict';

angular.module('enterpriseSearchApp')

/***************************************************************************************************************
 * search directive for treemap & glyoh
 ****************************************************************************************************************/

  .directive('searchspace', function ($window, $rootScope) {

    var directive = {};
    directive.restrict = 'E';
    /* restrict this directive to elements */

    directive.link = function ($scope, element, attributes) {


      /***************************************************************************************************************
       * Event handlers - after receiving treemap/search data
       * Draw the glyphs - event handler will invoke it
       ****************************************************************************************************************/

      $scope.$on('event:treemapbuild-received', function (name, args) {

        console.log("Client: treemapbuild data received!, call updateTreemapBuild. ", args);
        updateTreemapBuild(args, element[0], $rootScope.treemapCoordinates, $rootScope.zoomTreemap);
      });


      $scope.$on('event:searchresult-received', function (name, args) {

        console.log("Client: Search results received!, call updateFSGlyph. ", args);
        updateFSGlyph(args, element[0], $rootScope.treemapCoordinates);
      });


    }; //link

    return directive;
  });

'use strict';

angular.module('enterpriseSearchApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('mainpage', {
        url: '/mainpage',
        templateUrl: 'app/mainpage/mainpage.html',
        controller: 'mainpageController'
      })
      .state('searchspace', {
        url: '/searchspace',
        templateUrl: 'app/mainpage/searchspace.html',
        controller: 'searchspaceController'
      });
  });

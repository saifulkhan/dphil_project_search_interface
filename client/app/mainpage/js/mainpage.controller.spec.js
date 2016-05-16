'use strict';

describe('Controller: mainpageController', function () {

  // load the controller's module
  beforeEach(module('enterpriseSearchApp'));

  var mainpageController, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    mainpageController = $controller('mainpageController', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});

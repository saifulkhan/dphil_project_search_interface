'use strict';

/***************************************************************************************************************
 * Main page - search form, search results and provenance graphs.
 ***************************************************************************************************************/

var enterpriseSearchApp = angular.module('enterpriseSearchApp');

enterpriseSearchApp.controller('mainpageController', function ($scope, $rootScope, $http, $window, $modal, selectedQueryFactory) {

  /***************************************************************************************************************
   * Dynamically calculate the frame coordinates
   * 1. Row1: Search frame
   * 2. Row2: F+C graph
   * 3. Row3: Radial graph and Glyph-based detail view
   ****************************************************************************************************************/

  $rootScope.windowCoordinates = {
    width: $window.innerWidth - 20,
    height: $window.innerHeight - 230
  };

  $rootScope.searchFrame = {
    width: $rootScope.windowCoordinates.width,
    height: $rootScope.windowCoordinates.height * 0.25 // 25% space is assigned to search frame or first row
  };

  $rootScope.fcgraphFrame = {
    width: $rootScope.windowCoordinates.width,
    height: $rootScope.windowCoordinates.height * 0.30 // 25% space is assigned to focus+context graph frame or second row
  };

  $rootScope.radialgraphFrame = {
    width: $rootScope.windowCoordinates.height * 0.45,
    height: $rootScope.windowCoordinates.height * 0.45,// 50% space is assigned to radial graph or frame or third row
  };

  // the remaining space will be divided among query and result

  $rootScope.queryGraphCoordinates = {
    x: 20,  // TODO: position hardcoded for laptop = 20
    y: 0,
    w: $rootScope.windowCoordinates.width - $rootScope.radialgraphFrame.width, // - $rootScope.radialgraphFrame.width,
    h: $rootScope.radialgraphFrame.height / 2
  };

  $rootScope.resultGraphCoordinates = {
    x: $rootScope.queryGraphCoordinates.x,
    y: $rootScope.queryGraphCoordinates.y + $rootScope.queryGraphCoordinates.h,
    w: $rootScope.queryGraphCoordinates.w,
    h: $rootScope.queryGraphCoordinates.h
  };

  $rootScope.queryNumber = 0;

  $scope.setCoordinates = function () {

    $('#tableview').slimscroll({
      color: '#00f',
      size: '10px',
      // width: '150px',
      height: $rootScope.searchFrame.height
    });

    /*
     $('#radialgraphwidth').width(

     $rootScope.radialgraphFrame.width
     );

     //$('#glyphviewwidth').width(
     //$rootScope.radialgraphFrame.width
     //);
     */

  };

  $scope.$on('$viewContentLoaded', function () {
    //call it after the page is loaded
    $scope.setCoordinates();
  });

  console.log("windowCoordinates=", $rootScope.windowCoordinates);
  console.log("searchFrame=", $rootScope.searchFrame);
  console.log("fcgraphFrame=", $rootScope.fcgraphFrame);
  console.log("radialgraphFrame=", $rootScope.radialgraphFrame);
  console.log("queryGraphCoordinates=", $rootScope.queryGraphCoordinates);
  console.log("resultGraphCoordinates=", $rootScope.resultGraphCoordinates);


  /***************************************************************************************************************
   * The search query form data
   ****************************************************************************************************************/

  $scope.query = {
    key: "",
    type: "",
    sizefrom: "",
    sizefrom_unit: "KB",
    sizeto: "",
    sizeto_unit: "KB",
    datefrom: "",
    dateto: ""
  };


  // Size measurements in the form
  $scope.units = {
    "type": "select",
    "name": "units",
    "value": "None",
    "values": ["b", "kb", "gb", "mg"]
  };

  // When the user invoke a new query without saving any portfolio, it should save the results automatically.
  $scope.autoFeedback = false;
  $scope.resultPortfolio = [];
  $scope.searchresult = [];


  /************************************************************************************************
   * When the page loads first time.
   * Treemap
   ************************************************************************************************/

  $scope.$on('$viewContentLoaded', function () {

    $scope.provis_window =
      $window.open("/searchspace", "Search Space: Treemap & Glyph", "height=850, width=1500");
  });


  /************************************************************************************************
   * This function is invoked on page unloading.
   * It is used to close the child window, searchspace before unloading.
   ****************************************************************************************************************/

  $window.onunload = function (event) {
    $scope.provis_window.close();
    return 'Thank you';
  }


  /***************************************************************************************************************
   * This function is invoked before the page is closed.
   * It is used to confirm if the user is willing to leave the page.
   ****************************************************************************************************************/

  $window.onbeforeunload = function (event) {
    var message = 'Sure you want to leave?';
    //$scope.provis_window.close();
    if (typeof event == 'undefined') {
      event = $window.event;
      //$scope.provis_window.close();
    }
    if (event) {
      alert("hello2");
      event.returnValue = message;
    }
    return message;
  }


  /***************************************************************************************************************
   * searchspace page page related
   ****************************************************************************************************************/
  $scope.searchspacePage = function () {
    $window.open("/searchspace", "_blank");
  }

  /*****************************************************************************************************************
   * Search http request
   * Search form: Input {"Name: ", "Type: [a, b, c]", "size:[sizex(unit), sizey(unit)]", "date:[date1, date2]}
   * Display search results in the table
   * Send the search result to do draw gyphs
   ****************************************************************************************************************/

  $scope.searchQuery = {
    key: "",
    type: "",
    sizefrom: "",
    sizeto: "",
    datefrom: "",
    dateto: ""
  };

  $scope.search = function () {

    // empty
    $scope.searchQuery.key = "";
    $scope.searchQuery.type = "";
    $scope.searchQuery.sizefrom = "";
    $scope.searchQuery.sizeto = "";
    $scope.searchQuery.datefrom = "";
    $scope.searchQuery.dateto = "";


    // When autoFeedback is true then send explicit feedback.
    if ($scope.autoFeedback) {
      $scope.saveResultPortfolio();
    }

    // Read query fields from the search query form.
    $scope.searchQuery['key'] = $scope.query["key"];
    $scope.searchQuery['type'] = $scope.query["type"];

    $scope.searchQuery['sizefrom'] = $scope.query["sizefrom"];
    if ($scope.searchQuery["sizefrom"].length > 0) {
      $scope.searchQuery['sizefrom'] = $scope.searchQuery['sizefrom'] + " " + $scope.query["sizefrom_unit"];
    }

    $scope.searchQuery['sizeto'] = $scope.query["sizeto"];
    if ($scope.searchQuery["sizeto"].length > 0) {
      $scope.searchQuery['sizeto'] = $scope.searchQuery['sizeto'] + " " + $scope.query["sizeto_unit"];
    }

    $scope.searchQuery.datefrom = $scope.query.datefrom;
    $scope.searchQuery.dateto = $scope.query.dateto;

    /*
     * Check if empty query-key then do nothing.
     */
    if (!$scope.searchQuery['key'].length) {

      alert("Enter search keywords!")
      return;
    }


    /*
     * Broadcast the new query.
     * This event will be processed by queryProvVisDirective: draw query glyph.
     */

    // TODO: check? Now when result/portfolio is saved thenonly we show the query
    //$scope.$broadcast('event:newquery-received', newquery);


    /*
     * Send query request to server.
     * Receive the result.
     * Write to localstorage i.e., send to the second window.
     */
    $http.post('/api/common/search', $scope.searchQuery).success(function (response) {

      $scope.disablePortfolioButton = false;
      $scope.autoFeedback = true;

      // Flush previous results & portfolio.
      $scope.resultPortfolio = [];
      // TODO: Test it. Bug: if a search result is null then it shows previous result only.
      $scope.searchresult = [];

      /*
       * Write Search result to local storage
       */

      if (response && response.length != 0) {
        $scope.searchresult = response;
        var resultString = JSON.stringify($scope.searchresult);
        //console.log("W1: writting to local storage, result: ", resultString);
        $window.localStorage.setItem('new-result', resultString);
      }
    })
      .error(function (data, status, headers, config) {
        //post request fails
        if (status == 400) {
          alert("Could not insert data");
        }
      })

  } // End: search function


  /*******************************************************************************************************************
   * Portfolio: Select the Documents
   ******************************************************************************************************************/

  $scope.selectDocument = function (index) {
    //alert('index:' + index);
    $scope.resultPortfolio.push($scope.searchresult[index]);
    $scope.searchresult[index].select = true;
    //$scope.resultPortfolio.push($scope.tabledata[index]);
  }

  function removeRecord(docid) {
    for (var i = 0; i < $scope.resultPortfolio.length; i++) {
      if ($scope.resultPortfolio[i].docid == docid) {
        $scope.resultPortfolio.splice(i, 1);
        break;
      }
    }
  }

  $scope.deselectDocument = function (index) {
    //alert('index:' + index);
    var docid = $scope.searchresult[index].docid;
    removeRecord(docid);
    $scope.searchresult[index].select = false;
    //$scope.resultPortfolio.push($scope.tabledata[index]);
  }

  /*
   * Selected document dialogbox.
   *
   */
  $scope.viewDialog = function (message) {

    $scope.selected_documents = $scope.resultPortfolio;
    // alert('docs:' + $scope.selected_documents);
    var modalInstance = $modal.open({
      templateUrl: 'view_rows',
      controller: ["$scope", "$modalInstance", "seldocs", ModalInstanceCtrl],
      size: 'lg',
      resolve: {
        seldocs: function () {
          return $scope.resultPortfolio;
        }
      }
    });

    return modalInstance;
  }

  var ModalInstanceCtrl = function ($scope, $modalInstance, seldocs) {
    $scope.seldocs = seldocs;
    $scope.selected = {
      item: $scope.diaglogbox_message
    };

    $scope.ok = function () {
      // $modalInstance.close($scope.selected.item);
      $modalInstance.close();
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };


  /*****************************************************************************************************************
   * Form: Date formatting.
   ****************************************************************************************************************/
  function dateToString(datevalue) {

    var datestr = "";
    if (angular.isDefined(datevalue) && datevalue) {

      var month = datevalue.getMonth() + 1;
      datestr = datevalue.getFullYear() + "-" + month + "-" + datevalue.getDate();
    }

    console.log("dateToString: datestr= ", datestr, ", datevalue= ", datevalue)
    return datestr;
  }

  $scope.datefromChange = function () {
    $scope.query.datefrom = dateToString($scope.query.datefrom);
  }

  $scope.datetoChange = function () {
    $scope.query.dateto = dateToString($scope.query.dateto);
  }

  /*****************************************************************************************************************
   * Form: Date calendar.
   ****************************************************************************************************************/
  $scope.today = function () {
    $scope.todayDate = new Date();
  };
  $scope.today();

  $scope.clear = function () {
    $scope.todayDate = null;
  };

  // Disable weekend selection
  $scope.disabled = function (date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.toggleMin = function () {
    $scope.minDate = $scope.minDate ? null : new Date();
  };
  $scope.toggleMin();

  $scope.open = function ($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.open2 = function ($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened2 = true;
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };


  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'yyyy-MM-dd', 'shortDate'];
  $scope.format = $scope.formats[3];


  /*****************************************************************************************************************
   * Save selected search results.
   * Broadcast the saved result (or provenance).
   * Taken care of by the resultProvVisDirective : draw result glyph
   ****************************************************************************************************************/

  $scope.saveResultPortfolio = function () {

    $scope.disablePortfolioButton = true;
    $scope.autoFeedback = false;

    // Show the query
    // TODO: can two broadcast be merged?
    $rootScope.queryNumber++;
    $scope.$broadcast('event:searchquery-received', $scope.searchQuery);

    // Show the results
    $scope.$broadcast('event:saved-result-received', $scope.searchresult);
    $http.post('/api/common/feedback', $scope.searchresult).success(function (response) {
      if (response) {

      }

    })
      .error(function (data, status, head, config) {

      });
  }


  /*****************************************************************************************************************
   * Start: of Provenance code
   *****************************************************************************************************************/

  $scope.queryDataArray = [];
  $scope.resultData = [];


  /******************************************************************************************************************
   * Send the reformulated query to W1,
   * Write to local storage.
   ******************************************************************************************************************/
  $scope.sendReformulatedQuery = function () {

    var selectedQueries = selectedQueryFactory.getSelectedQuery();
    console.log("Reformulate queries:", selectedQueries);
    if (selectedQueries == {}) {
      return;
    }

    // Intersect the selected queries.
    //var newQuery = { key: "", type: "", sizefrom: "", sizeto: "", datefrom: "", dateto: ""};
    var mergedQuery = intersectQueries(selectedQueries);
    selectedQueryFactory.clear();

    // Update the search form with the reformulated query.
    $scope.query["key"] = mergedQuery["key"];
    $scope.query["type"] = mergedQuery["type"];

    var token = mergedQuery["sizefrom"].split(" ");
    $scope.query["sizefrom"] = token[0];
    $scope.query["sizefrom_unit"] = token[1];

    token = mergedQuery["sizeto"].split(" ");
    $scope.query["sizeto"] = token[0];
    $scope.query["sizeto_unit"] = token[1];

    $scope.query["datefrom"] = mergedQuery["datefrom"];
    $scope.query["dateto"] = mergedQuery["dateto"];

  } // END sendReformulatedQuery.


  $scope.selectedQueryListLength = function () {
    var length = selectedQueryFactory.length;
    return length;
  }


  /******************************************************************************************************************
   * Dialog for reviewing selected queries.
   ******************************************************************************************************************/

  $scope.openSelectedQueryDialog = function () {
    var modalInstance = $modal.open({
      templateUrl: 'edit_reformulated_query',
      controller: ["$scope", "$modalInstance", "selectedQueries", selectedQueryCtrl],
      size: 'md',
      resolve: {
        selectedQueries: function () {
          return selectedQueryFactory.getSelectedQuery();
        }
      }
    });

    modalInstance.result.then(function (selectedQueries) {
      //$scope.reformulatedQuery = intersectQueries(selectedQueries);
      //console.log("selectedQueries:", selectedQueries, $scope.reformulatedQuery);
    }, function () {
      //alert('not confirmed');
    });

    return modalInstance;
  }


  var selectedQueryCtrl = function ($scope, $modalInstance, selectedQueries) {
    $scope.selectedQueries = selectedQueries;
    $scope.ok = function () {
      $modalInstance.close($scope.selectedQueries);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  };


  /******************************************************************************************************************
   * Save the session
   * Send a signal to the server
   ******************************************************************************************************************/
  $scope.saveSession = function () {
    var status = {"signal": true};
    $http.post('/api/common/savesession', status).success(function (response) {
      if (response) {

      }

    })
      .error(function (data, status, head, config) {

      });

  } // END saveSession.


}); // End: Controller


enterpriseSearchApp.factory("selectedQueryFactory", function () {

  var selectedQuery = [];
  return {
    length: selectedQuery.length,

    addSelectedQuery: function (query) {
      selectedQuery.push(query);
      console.log("selectedQueryFactory::addSelectedQuery- ", selectedQuery);
    },

    getSelectedQuery: function () {
      return selectedQuery;
    },

    clear: function () {
      selectedQuery = [];
    }
  };
}); // End: factory


/*********************************************************************************************************************
 * Directive: Selected query (provenance) list dialog
 ********************************************************************************************************************/
enterpriseSearchApp.directive("querylist", function () {
  var directive = {};
  directive.restrict = 'E';
  directive.transclude = true;
  directive.template = '<div class="scrollbox" ng-transclude></div>';

  directive.link = function ($scope, elements, attributes) {

    var dialogOptions = {
      title: "Queries: List View",
      width: 300,
      height: 200,
      modal: false,
      resizable: true,
      closeOnEscape: false,
      position: {my: "left top", at: "left bottom"},
      draggable: true,
      close: function () {
        $(this).remove();
      }
    };

    var dialogExtendOptions = {
      "closable": false,
      "maximizable": false,
      "minimizable": true,
      //"minimizeLocation" : false,
      "collapsable": false,
      "dblclick": false,
      "titlebar": false, //"transparent",
      "minimizeLocation": "left"
    };

    $(elements[0]).dialog(dialogOptions).dialogExtend(dialogExtendOptions);

  }
  return directive;
});


/*********************************************************************************************************************
 * Directive: Late-Discovery directive dialog
 ********************************************************************************************************************/
enterpriseSearchApp.directive("latediscovery", function () {
  var directive = {};
  directive.restrict = 'E';
  directive.transclude = true;
  directive.template = '<div class="scrollbox" ng-transclude></div>';

  directive.link = function ($scope, elements, attributes) {

    var dialogOptions = {
      title: "Late Discovery",
      dialogClass: 'late-discovery',
      width: 300,
      height: 200,
      modal: false,
      resizable: true,
      closeOnEscape: false,
      position: {
        my: "left top",
        at: "left bottom"
      },
      draggable: true,
      close: function () {
        $(this).remove();
      }
    };

    var dialogExtendOptions = {
      closable: false,
      maximizable: false,
      minimizable: true,
      //"minimizeLocation" : false,
      collapsable: false,
      dblclick: false,
      titlebar: false, //"transparent",
      minimizeLocation: "left"

    };

    $(elements[0]).dialog(dialogOptions).dialogExtend(dialogExtendOptions);

  }
  return directive;
});

'use strict';

var enterpriseSearchApp = angular.module('enterpriseSearchApp');

/***************************************************************************************************************
 * Directive
 * Query Prov
 ****************************************************************************************************************/

enterpriseSearchApp.directive('queryprovis', ["$compile", "$window", "$rootScope", "selectedQueryFactory",
  function ($compile, $window, $rootScope, selectedQueryFactory) {

    var directive = {};

    directive.restrict = 'E';  // restrict this directive to elements

    directive.link = function ($scope, element, attributes) {

      var queryGraph = {
        // Arg
        svgCoordinate: {},
        selector: "",

        glyphSize: 50,
        iconSize: 11,
        distanceX: 60,
        nodeCoordinate: new Array(), // [{"x":, "y"}, ..]
        queryArray: [],
        svgCanvas: null,
        queryChangeFlag: {},  // attribute: [key, type, size, date]; value: [unset = 0 , set = 1, changed = 2]

        newQueryFlag: true,

        /*
         * Update the current node co-ordinate
         */
        pushNodeCoordinate: function (arg) {
          this.nodeCoordinate.push(arg);
        },

        getLastNodeCoordinate: function () {
          if (this.nodeCoordinate.length) {
            return this.nodeCoordinate[this.nodeCoordinate.length - 1];
          } else {
            return {};
          }
        },

        getCanvas: function () {
          // Glyphs will be drawn in the same canvas
          if (this.svgCanvas == null) {
            this.svgCanvas = d3.select(this.selector)
              .append("svg")
              .attr("x", this.svgCoordinate.x)
              .attr("y", this.svgCoordinate.y)
              .attr("width", this.svgCoordinate.w)
              .attr("height", this.svgCoordinate.h)
              .style("background", "none"); // debug: make it colored (blue) to see the canvas pos.
          }
          return this.svgCanvas;
        },

        // queryArray array of the queries (a query is a object)
        pushLastQuery: function (query) {
          this.queryArray.push(query);
        },

        getLastQuery: function () {
          if (this.queryArray.length > 0) {
            return this.queryArray[this.queryArray.length - 1];
          } else {
            return "";
          }
        },
        getQuery: function (index) {
          return this.queryArray[index];
        }
      };

      /********************************************************************************************************
       * Each time a new query comes this update() will be calleed
       * This will draw the glyph.
       *  Value: unset = 0 , set = 1, (set +) changed = 2
       ********************************************************************************************************/

      function processQuery(query, selector, svgCoordinate) {


        console.log("processQuery", query, selector, svgCoordinate);

        queryGraph.selector = selector;
        queryGraph.svgCoordinate = svgCoordinate;

        // 0 = unset, 1 = set & same, 2 = set & different
        var queryChangeFlag = {key: 0, type: 0, size: 0, date: 0};

        var queryLast = queryGraph.getLastQuery();
        console.log("last:", queryLast);
        //console.log("last:", queryLast["key"], queryLast["type"], queryLast["size"], queryLast["date"]);

        console.log("current :", query);
        //console.log("current:", query["key"], query["type"], query["size"], query["date"]);


        /*
         * Compare with last query - and process the query fiellds
         */
        if (query["key"].length == 0) {
          queryChangeFlag["key"] = 0;
        } else if (queryLast) {                          // At the very first time it is null, so queryLast["key"] will give can't read property error
          if (query["key"].toLowerCase() == queryLast["key"].toLowerCase()) {
            queryChangeFlag["key"] = 1;
          } else {
            queryChangeFlag["key"] = 2;
          }
        } else {
          queryChangeFlag["key"] = 2;
        }

        // type
        if (query["type"].length == 0) {
          queryChangeFlag["type"] = 0;
        } else if (queryLast && queryLast["type"]) {
          if (query["type"].toLowerCase() == queryLast["type"].toLowerCase()) {
            queryChangeFlag["type"] = 1;
          } else {
            queryChangeFlag["type"] = 2;
          }
        } else {
          queryChangeFlag["type"] = 2;
        }

        // size
        var size = query["sizefrom"] + query["sizeto"];
        var lastSize;
        if (queryLast) {
          lastSize = queryLast["sizefrom"] + queryLast["sizeto"];
        } else {
          lastSize = "";
        }

        if (size == "") {
          queryChangeFlag["size"] = 0;
        } else if (size == lastSize) {
          queryChangeFlag["size"] = 1;
        } else {
          queryChangeFlag["size"] = 2;
        }


        // date
        var date = query["datefrom"] + query["dateto"];
        var lastDate;
        if (queryLast) {
          lastDate = queryLast["datefrom"] + queryLast["dateto"];
        } else {
          lastDate = "";
        }

        if (date == "") {
          queryChangeFlag["date"] = 0;
        } else if (date == lastDate) {
          queryChangeFlag["date"] = 1;
        } else {
          queryChangeFlag["date"] = 2;
        }

        queryGraph.queryChangeFlag = queryChangeFlag;
        console.log("queryChangeFlag:" + JSON.stringify(queryChangeFlag)
          + "\nquery:" + JSON.stringify(query)
          + "\nqueryLast:" + JSON.stringify(queryLast));

        queryGraph.pushLastQuery({key: query.key, type: query.type, size: query.size, date: query.date});

        drawQueryGraph();
      }


      /********************************************************************************************************
       * Drawing
       ********************************************************************************************************/

      function drawQueryGraph() {

        console.log("updateQueryGraph");

        var coordinate = {};
        var lastCoordinate = queryGraph.getLastNodeCoordinate();
        if (Object.getOwnPropertyNames(lastCoordinate).length === 0) {
          coordinate["x"] = (queryGraph.glyphSize + queryGraph.distanceX) * 0.5;
          // TODO: position hardcoded for laptop = 80
          coordinate["y"] = queryGraph.glyphSize + queryGraph.distanceX / 2 - 80 + queryGraph.svgCoordinate.h / 2;
        } else {
          coordinate["x"] = lastCoordinate["x"] + queryGraph.glyphSize + queryGraph.distanceX;
          coordinate["y"] = lastCoordinate["y"];
        }
        queryGraph.pushNodeCoordinate(coordinate);

        console.log("drawQueryGraph() : lastCoordinate", lastCoordinate, ", coordinate: ", coordinate);

        var svgCanvas = queryGraph.getCanvas();
        var svg = svgCanvas.append("g")
          .attr("transform", "translate(" + coordinate["x"] + ", " + coordinate["y"] + ")");

        // draw the axis
        drawTemporalAxis(svgCanvas, coordinate);
        queryGraph.newQueryFlag = true;

        var radius = queryGraph.glyphSize * 0.5;
        var query = queryGraph.getLastQuery();
        var queryChangeFlag = queryGraph.queryChangeFlag;
        console.log("query", query, "; flags", queryChangeFlag);

        var key_pie = d3.svg.arc()
          .innerRadius(0)
          .outerRadius(radius)
          .startAngle(0)
          .endAngle(0.5 * Math.PI);

        svg.append("path")
          .attr("d", key_pie)
          .attr("class", "wedge")
          .style("fill", wedgeColor("key", queryChangeFlag.key))
          .append("title")
          .text(function (d) {
            return query.key;
          });

        var type_pie = d3.svg.arc()
          .innerRadius(0)
          .outerRadius(radius)
          .startAngle(0.5 * Math.PI)
          .endAngle(1.0 * Math.PI);

        svg.append("path")
          .attr("d", type_pie)
          .attr("class", "wedge")
          .style("fill", wedgeColor("type", queryChangeFlag.type))
          .append("title")
          .text(function (d) {
            return query.type;
          });

        var size_pie = d3.svg.arc()
          .innerRadius(0)
          .outerRadius(radius)
          .startAngle(1.0 * Math.PI)
          .endAngle(1.5 * Math.PI);

        svg.append("path")
          .attr("d", size_pie)
          .attr("class", "wedge")
          .style("fill", wedgeColor("size", queryChangeFlag.size))
          .append("title")
          .text(function (d) {
            return query.sizefrom + " to " + query.sizeto;
          });

        var date_pie = d3.svg.arc()
          .innerRadius(0)
          .outerRadius(radius)
          .startAngle(1.5 * Math.PI)
          .endAngle(2.0 * Math.PI);

        svg.append("path")
          .attr("d", date_pie)
          .attr("class", "wedge")
          .style("fill", wedgeColor("date", queryChangeFlag.date))
          .append("title")
          .text(function (d) {
            return query.datefrom + " to " + query.dateto;
          });


        function wedgeColor(field, value) {

          if (value == 0) {
            return "LightGray "; // Grey
          }

          if (field == "key") {
            return "rgb(163, 216, 84)"; // Kiwi

          } else if (field == "type") {
            return "rgb(172, 212, 228)"; // Turquoise

          } else if (field == "size") {
            return "rgb(218, 142, 142)"; // Scarlet

          } else if (field == "date") {
            return "rgb(230, 208, 0)"; // Daisy

          } else {
            return "LightGray "; // Grey for unknown
            // TODO should not be here
          }
        }


        /********************************************************************************************************
         * Icons
         ********************************************************************************************************/
        if (queryChangeFlag.key == 2) {
          keyIcon();
        }
        if (queryChangeFlag.type == 2) {
          typeIcon();
        }
        if (queryChangeFlag.size == 2) {
          sizeIcon();
        }
        if (queryChangeFlag.date == 2) {
          dateIcon();
        }

        /*
         * Key icon
         */
        function keyIcon() {

          var xKey = radius * Math.cos(Math.PI / 4) - queryGraph.iconSize * 0.5;
          var yKey = -radius * Math.sin(Math.PI / 4) - queryGraph.iconSize * 0.5;
          svg.append("g")
            .attr("transform", "translate(" + xKey + ", " + yKey + ")")
            .append("svg:image")
            .attr("width", queryGraph.iconSize)
            .attr("height", queryGraph.iconSize)
            .attr("xlink:href", "../../app/mainpage/icons/keyIcon.svg");
        }

        /*
         * Type (icon)
         */
        function typeIcon() {
          var xKey = radius * Math.cos(Math.PI / 4) - queryGraph.iconSize * 0.5;
          var yKey = radius * Math.sin(Math.PI / 4) - queryGraph.iconSize * 0.5;
          svg.append("g")
            .attr("transform", "translate(" + xKey + ", " + yKey + ")")
            .append("svg:image")
            .attr("xlink:href", "../../app/mainpage/icons/typeIcon.svg")
            .attr("width", queryGraph.iconSize)
            .attr("height", queryGraph.iconSize);
        }

        /*
         * size (icon)
         */
        function sizeIcon() {

          var xKey = -radius * Math.cos(Math.PI / 4) - queryGraph.iconSize * 0.5;
          var yKey = radius * Math.sin(Math.PI / 4) - queryGraph.iconSize * 0.5;
          svg.append("g")
            .attr("transform", "translate(" + xKey + ", " + yKey + ")")
            .append("svg:image")
            .attr("xlink:href", "../../app/mainpage/icons/sizeIcon.svg")
            .attr("width", queryGraph.iconSize)
            .attr("height", queryGraph.iconSize);

        }

        /*
         * date (calender icon)
         */
        function dateIcon() {
          var xKey = -radius * Math.cos(Math.PI / 4) - queryGraph.iconSize * 0.5;
          var yKey = -radius * Math.sin(Math.PI / 4) - queryGraph.iconSize * 0.5;
          svg.append("g")
            .attr("transform", "translate(" + xKey + ", " + yKey + ")")
            .append("svg:image")
            .attr("xlink:href", "../../app/mainpage/icons/dateIcon.svg")
            .attr("width", queryGraph.iconSize)
            .attr("height", queryGraph.iconSize);
        }
      }


      /********************************************************************************************************
       * If this is the first node then just, draw a point.
       * Else draw a connecting line joining the last coordinate.
       ********************************************************************************************************/
      var temporalAxis = {

        pointRadius: 3,
        tickLength: 15,
        svgCanvas: null,
        pointCoordinate: new Array(),
        index: 0,
        linkCoordinates: new Array(),


        /*
         * Update the current node co-ordinate
         */
        pushPointCoordinate: function (arg) {
          this.pointCoordinate.push(arg);
        },

        getLastPointCoordinate: function () {
          if (this.pointCoordinate.length) {
            return this.pointCoordinate[this.pointCoordinate.length - 1];
          } else {
            return {};
          }
        }
      };


      function drawTemporalAxis(svgCanvas, coordinate) {

        var lastPointCoordinate = temporalAxis.getLastPointCoordinate();

        var pointCoordinate = {};
        pointCoordinate["x"] = coordinate["x"];
        pointCoordinate["y"] = coordinate["y"] + queryGraph.glyphSize * 0.5 + temporalAxis.tickLength;
        console.log("drawTemporalAxis- coordinate", coordinate, ", lastCoordinate: ", lastPointCoordinate, ", pointCoordinate: ", pointCoordinate);
        temporalAxis.pushPointCoordinate(pointCoordinate);


        if (Object.getOwnPropertyNames(lastPointCoordinate).length === 0) {
          console.log("if-cond, lastCoordinate", lastPointCoordinate);
          // no need to draw any line
        } else {
          console.log("else-cond");

          svgCanvas.append("line")
            .attr("x1", lastPointCoordinate["x"])
            .attr("y1", lastPointCoordinate["y"])
            .attr("x2", pointCoordinate["x"])
            .attr("y2", pointCoordinate["y"])
            .style("stroke", "gray")
            .style("stroke-dasharray", function () {
              if (queryGraph.newQueryFlag) {
                return "none";
              } else {
                return "3, 3";
              }
            });
        }

        // ticks
        svgCanvas.append("line")
          .attr("x1", pointCoordinate["x"])
          .attr("y1", pointCoordinate["y"] - temporalAxis.tickLength)
          .attr("x2", pointCoordinate["x"])
          .attr("y2", pointCoordinate["y"] + temporalAxis.tickLength)
          .style("stroke", "gray")
          .style("stroke-dasharray", "none");


        // point
        svgCanvas.append("circle")
          .attr("cx", pointCoordinate["x"])
          .attr("cy", pointCoordinate["y"])
          .attr("r", temporalAxis.pointRadius)
          .attr("index", function () {
            var tempIndex = temporalAxis.index;
            temporalAxis.index++;
            return tempIndex;
          })
          .attr("x", coordinate["x"])
          .attr("y", coordinate["y"])
          .style("fill", "gray")
          .on("mouseover", function () {
            d3.select(this)
              .style("fill", "orange");
          })
          .on("mouseout", function () {
            d3.select(this)
              .style("fill", "gray");
          })
          .on("click", function () {
            queryGraph.newQueryFlag = false;

            var c = {};
            c["x"] = parseFloat(d3.select(this).attr("x"));
            c["y"] = parseFloat(d3.select(this).attr("y"));
            temporalAxis.linkCoordinates.push(c);
            console.log("store coordinate:", c);
            var query = queryGraph.getQuery(d3.select(this).attr("index"));
            selectedQueryFactory.addSelectedQuery(query);
          });

        if (!queryGraph.newQueryFlag) {

          temporalAxis.linkCoordinates.push(coordinate);

          console.log("linkCoordinates: ", temporalAxis.linkCoordinates);
          drawLink(svgCanvas, temporalAxis.linkCoordinates);
          temporalAxis.linkCoordinates = [];
        }
      }


      /********************************************************************************************************
       * Draw link/edge or links between source nodes and a destination node.
       * Color - change color on mouse hover
       * points [[x, y], [x, y], ...]
       * Connect: H - L -H
       ********************************************************************************************************/

      var link = {
        offY: 8,
        offX: 8,
        offset: 8,
        temp: 0

      };

      function drawLink(svg, points) {

        var offX = parseFloat(link.offX);
        var offY = parseFloat(link.offY);

        points.sort(function (a, b) {
          if (a["x"] < b["x"]) {
            return -1;
          } else if (a["x"] > b["x"]) {
            return 1;
          } else {
            return 0;
          }
        });

        console.log("drawLink: points(sorted?):", points, offX, offY);

        var lineData = [];
        for (var i = 0; i < points.length; ++i) {
          /*
           * The last or incoming x-offset is different then the out-going.
           */
          var x1 = 0;
          var x2 = 0;
          var y1 = 0;
          var y2 = 0;

          // Last or destination node
          if (i == points.length - 1) {
            x2 = points[i]["x"];
            x1 = x2 - offX;
            y2 = points[i]["y"] - queryGraph.glyphSize * 0.5;
            y1 = y2 - offY;

            lineData.push({"x": x1, "y": y1});
            lineData.push({"x": x2, "y": y2});
            console.log("Dest:", x1, y1, ",", x2, y2);

          } else {
            x1 = points[i]["x"];
            x2 = x1 + offX;
            y1 = points[i]["y"] - queryGraph.glyphSize * 0.5;
            y2 = y1 - offY;

            lineData.push({"x": x2, "y": y2});
            lineData.push({"x": x1, "y": y1});
            lineData.push({"x": x2, "y": y2});
            console.log("Src:", x1, y1, ", ", x2, y2);
          }
        }

        console.log(lineData);

        link.offY += link.offset;

        var lineFunction = d3.svg.line()
          .x(function (d) {
            return d.x;
          })
          .y(function (d) {
            return d.y;
          })
          .interpolate("linear");

        svg.append("path")
          .attr("d", lineFunction(lineData))
          .style("stroke-width", 0.5)
          .style("stroke", "rgb(6,120,155)")
          .style("fill", "none")
          .on("mouseover", function () {
            d3.select(this)
              .style("stroke", "orange");
          })
          .on("mouseout", function () {
            d3.select(this)
              .style("stroke", "rgb(6,120,155)");
          });

      }


      /********************************************************************************************************
       * Handle the new query event
       ********************************************************************************************************/
      $scope.$on('event:searchquery-received', function (event, args) {

        var newquery = args;

        console.log("event:searchquery-received...",
          "\nsearchquery: ", newquery,
          "\nelement[0]: ", element[0],
          "\n$rootScope.queryGraphCoordinates: ", $rootScope.queryGraphCoordinates,
          "\n");

        processQuery(newquery, element[0], $rootScope.queryGraphCoordinates);
      });

    }; //link

    return directive;
  }]);

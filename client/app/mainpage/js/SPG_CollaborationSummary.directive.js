/**
 * Created by search-engine on 02/05/15.
 */

'use strict';

var enterpriseSearchApp = angular.module('enterpriseSearchApp');


/***************************************************************************************************************
 * Directive : radialgraph
 ****************************************************************************************************************/

enterpriseSearchApp.directive('radialgraph', ["$compile", "$window", "$rootScope", "DataService",
  function ($compile, $window, $rootScope, DataService) {

    var directive = {};
    directive.restrict = 'E';  // restrict this directive to elements

    console.log("radialgraph directive");

    directive.link = function ($scope, element, attributes) {

      var drawRadialGraph = function (graphData) {

        console.log("function drawRadialGraph:");

        var MIN_WEIGHT = 0.1;
        var DOT_SIZE = 10;
        var GAP = 0.02 * Math.PI;
        var FONT_USER = 12;

        /***********************************************************************
         * SVG
         *
         ***********************************************************************/

        var margin = {top: 0, right: 0, bottom: 0, left: 0},

          width = $rootScope.radialgraphFrame.width - margin.left - margin.right,
          height = $rootScope.radialgraphFrame.height - margin.top - margin.bottom,
          x = 0,
          y = 0;

        var r = (width - 3 * DOT_SIZE - 2 * FONT_USER) / 2; // TODO:

        console.log("drawRadialGraph: dimension:", width, height);

        d3.select(element[0]).selectAll("*").remove();
        var svg = d3.select(element[0])
          .append("svg")
          .attr("x", x)
          .attr("y", y)
          .attr("width", width)
          .attr("height", height)
          .style("background", "none");

        var svgGroup = svg.append("g")
          .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");


        /***********************************************************************
         * Process Data: Data Structure
         *
         ***********************************************************************/

        var sessions = graphData.length;
        var nodesAtSession = [];
        var totalNodes = 0;

        graphData.forEach(function (d, i) {
          var val = d.children.length;
          nodesAtSession.push(val);
          totalNodes = totalNodes + val;
        })


        var totalGap = GAP * sessions;
        var theta = (2 * Math.PI - totalGap) / totalNodes;
        var offset = 0;
        var nodeMap = {};
        var nodes = [];


        /***********************************************************************
         * Node
         *  - each node position
         *  - a node map
         *  {
     *      id: X,
     *      pos: {x: X, y: X},
     *      adjList: [{id: X, w: X},... ]
     *      meta:
     *  }
         *
         ***********************************************************************/

        var legend = [];
        var offset = 0;
        graphData.forEach(function (d, i) {
          //console.log("forEach: d = ", d);

          var session = d.session;
          var user = d.user;
          var x;
          var y;

          var label = {startAngle: offset, endAngle: 0, user: user};

          d.children.forEach(function (c, i) {
            var key = c.id;
            x = r * Math.cos(offset - 0.5 * Math.PI);
            y = r * Math.sin(offset - 0.5 * Math.PI);

            //console.log("forEach: c = ", c);
            nodeMap[key] = {
              id: key,
              session: session,
              user: user,
              time: c.time,
              adjList: c.adjList,
              x: x,
              y: y,
              meta: {}
            };

            offset = offset + theta;
            nodes.push(c.id);
          })

          label.endAngle = offset;
          legend.push(label);

          offset = offset + GAP;

        }); // forEach


        /***********************************************************************
         * Compute the links
         *
         ***********************************************************************/

        var links = [];

        for (var key in nodeMap) {

          var adjList = nodeMap[key]["adjList"];
          //console.log("id: " + nodeMap[key]["id"] + ", adjList: " + dstNodes.length);

          if (adjList.length == 0) {
            continue;
          }

          var srcX = nodeMap[key].x;
          var srcY = nodeMap[key].y;

          adjList.forEach(function (d, i) {
            var id = d["id"];
            var w = d["w"];

            //console.log(id);
            if (w > MIN_WEIGHT) {
              var dstX = nodeMap[id].x;
              var dstY = nodeMap[id].y;
              links.push({source: {x: dstX, y: dstY}, target: {x: srcX, y: srcY}, w: w});
            }
          })
        }

        links.sort(function (a, b) {
          return a.w - b.w;
        });

        // Debug
        /*
         for (var x in nodeMap) {
         console.log("Key:" + x + "\n");
         console.log("Values: ", nodeMap[x]);

         }
         console.log("sessions= " + sessions + ", nodesAtSession = " + nodesAtSession, ", totalNodes = " + totalNodes);
         console.log("links: ", links);
         */

        /***********************************************************************
         * Draw the links/edges
         *
         ***********************************************************************/

        var diagonal = d3.svg.diagonal()
          .projection(function (d) {
            return [d.x, d.y];
          });

        var edgeColor = d3.scale.linear()
          .domain([MIN_WEIGHT, 0.99, 1.0])
          .range(["#fff", "#888888", "rgb(6,120,155)"]);


        /***************************************************************************************************************
         * d3.tip
         * Note: only working with d3.min.js but not with d3.v3.js or d3.v3.min.js
         /**************************************************************************************************************/

        var tipForLinks = d3.tip()
          .attr('class', 'd3-tip')
          //.offset([0, 0])
          .html(function (d) {
            return "<center>"
              + "<font size='1'>"
              + "<span style='color:white' >"
              //+ d.w
              + "<span style='color:#ff7f0e'> <br> <i>James's</i> [building material | dwg | 500MB-2GB] </br>"
              + "<span style='color:OrangeRed' > <br> [weight: 0.64] </br>"
              + "<span style='color:DodgerBlue' >"
              + "<br> <i>Emily's</i> [construction draft | dwg | 500MB-4GB]"
              + "</span>"

              + "</font>"
              + "</center>";
          });
        svgGroup.call(tipForLinks);


        // Draw the implicit links

        var implicitLinks = svgGroup.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("d", diagonal)
          .attr("class", "link")
          .attr("stroke", function (d) {
            if (d.w < 1) {
              return edgeColor(d.w);
            }
          })
          .on('mouseover', tipForLinks.show)
          .on('mouseout', tipForLinks.hide);


        /***************************************************************************************************************
         * Draw the dots.
         *
         ***************************************************************************************************************/

        //var nodeColor = d3.scale.category10();
        var nodeColor = d3.scale.ordinal()
          .domain(["James", "Saiful", "Andy", "Emily"])
          .range(["DodgerBlue", "#ff7f0e", "#9467bd", "#2ca02c"]);

        var circleGroup = svgGroup.selectAll(".circle")
          .data(nodes)
          .enter()
          .append("g")
          .attr("class", "circle");

        circleGroup.append("circle")
          .attr("cx", function (d) {
            return nodeMap[d].x;
          })
          .attr("cy", function (d) {
            return nodeMap[d].y;
          })
          .attr("r", DOT_SIZE / 2)
          .style("fill", function (d) {
            console.log(nodeMap[d].user + nodeColor(nodeMap[d].user));
            return nodeColor(nodeMap[d].user);
          })
          .append("title").text(function (d) {
          return nodeMap[d]["id"];
        });

        // Node label
        /*
         circleGroup.append("text")
         .attr("x", function (d) {
         return nodeMap[d]["pos"]["x"];
         })
         .attr("y", function (d) {
         return nodeMap[d]["pos"]["y"];
         })
         .attr("font-size", "5px")
         .attr("fill", "white")
         .text(function (d) {
         return nodeMap[d]["id"];
         });
         */


        /***********************************************************************
         * Draw the legend.
         *
         * START : legend-arc and label
         * TODO: Commented the whole section
         ***********************************************************************/


        console.log("legend", legend);

        var svgOuterLabel = svgGroup.selectAll(".legend")
          .data(legend)
          .enter()
          .append("g");

        var r1 = r + FONT_USER * 2;


        // legend-arc

        // TODO This arrow is not working
        // build the arrow.
        // http://bl.ocks.org/d3noob/5141278

        var markerWidth = 6,
          markerHeight = 6,
          cRadius = 0, // play with the cRadius value
          refX = cRadius + (markerWidth * 2),
          refY = -Math.sqrt(cRadius);


        svgOuterLabel.append("defs").selectAll("marker")
          .data(["xx"])      // Different link/path types can be defined here
          .enter().append("marker")    // This section adds in the arrows
          .attr("id", function (d) {
            //console.log("edgeArrow ... d=" + d);
            return d;
          })
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", refX)           // adjust the position
          .attr("refY", refY)
          .attr("fill", "MediumSeaGreen")
          .attr("markerWidth", markerWidth)
          .attr("markerHeight", markerHeight)
          .attr("orient", "auto")
          .append("svg:path")
          .attr("d", "M0,-5L10,0L0,5");



        var arcs = d3.svg.arc()
          .innerRadius(r1)
          .outerRadius(r1)
          .startAngle(function (d, i) {
            console.log(d.startAngle);
            return d.startAngle;
          })
          .endAngle(function (d, i) {
              console.log(d.endAngle);
              return d.endAngle - GAP;
            });

        // Draw the arcs
        svgOuterLabel.append("path")
          .attr("d", arcs)
          .attr("class", "ticks")         // TODO: outer arcs are not shown
          .attr("id", function (d, i) {
            return "id" + i;
          });

        // Add the arrow // TODO: outer arcs arrows alo are not shown
        svgOuterLabel.attr("marker-start", "url(" + location.href + "#" + "xx" + ")");



        //User name labels
        //Aligning text inside circular arc d3js:
        //http://stackoverflow.com/questions/13202407/aligning-text-inside-circular-arc-d3js


        var textLegendGroup = svgOuterLabel.append("g")
          .attr("id", "thing");

        textLegendGroup.append("text")
          .attr("class", "text")
          .style("font-size", FONT_USER + "px")
          .attr("dy", function (d, i) {
            return 15;  // TODO - radius position
          })
          .append("textPath")
          //.attr("textLength",function(d,i){return 90-i*5 ;})
          .attr("xlink:href", function (d, i) {
            return "#id" + i;
          })
          .attr("startOffset", function (d, i) {
            return 5 / 20;  // TODO - where it will start
          })
          .text(function (d) {
            return d.user;
          });



        // END of legend-arc and label

        /***********************************************************************
         * Build the Arrow.
         * http://bl.ocks.org/d3noob/5141278
         ***********************************************************************/
        var svg1 = svgGroup.selectAll(".legend1")
          .data(links)
          .enter()
          .append("g");


        // Per-type markers, as they don't inherit styles.
        var markerWidth = 6,
          markerHeight = 6,
          cRadius = 0, // play with the cRadius value
          refX = cRadius + (markerWidth * 2),
          refY = -Math.sqrt(cRadius);

        svg1.append("svg:defs").selectAll("marker")
          .data(["x"])
          .enter().append("svg:marker")
          .attr("id", function (d) {
            //console.log("edgeArrow ... d=" + d);
            return d;
          })
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", refX)
          .attr("refY", refY)
          .attr("markerWidth", markerWidth)
          .attr("markerHeight", markerHeight)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-5L10,0L0,5")
          //.attr("stroke", "red")
          .attr("fill", "rgb(6,120,155)");

        var explicitLink = svg1.selectAll(".explicitlink")
          .data(links)
          .enter().append("path")
          .attr("d", diagonal)
          .attr("class", "link")
          //.attr("marker-end", "url("+location.href+"#" + "arrowhead" + ")")
          //.attr("d", diagonal)
          .attr("stroke", function (d) {
            if (d.w == 1) {
              return edgeColor(d.w);
            }
          })
          .on('mouseover', tipForLinks.show)
          .on('mouseout', tipForLinks.hide)
          .attr("marker-end", function (d) {
            if (d.w == 1) {
              console.log("d.w= " + d.w + ", return: " + "url(#x)");
              return "url(" + location.href + "#" + "x" + ")";
            }
          });

      }// end radialGraph


      console.log("Call drawRadialGraph()... first");
      drawRadialGraph(DataService.getGraphData(0));


      /********************************************************************************************************
       * redraw the SPG-Collaboration-Summary
       ********************************************************************************************************/
      $scope.$on('event:searchquery-received', function (event, args) {

        console.log("event:searchquery-received...",
          "\nqueryNumber: ", $rootScope.queryNumber, "\n");
        console.log("call drawRadialGraph()...");

        drawRadialGraph(DataService.getGraphData($rootScope.queryNumber));
      });


    }; // link


    return directive;
  }]);

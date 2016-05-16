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

      var MIN_WEIGHT = 0.39;

      var DOT_SIZE = 8;
      var GAP = 0.02 * Math.PI;
      var LABEL = 12;

      /***********************************************************************
       * SVG
       *
       ***********************************************************************/

      var margin = {top: 0, right: 0, bottom: 0, left: 0},

        width = $rootScope.radialgraphFrame.width - margin.left - margin.right,
        height = $rootScope.radialgraphFrame.height - margin.top - margin.bottom,
        x = 0,
        y = 0;

      var r = (width - 3 * DOT_SIZE - 2 * LABEL) / 2; // TODO:

      console.log("drawRadialGraph: dimension:", width, height);

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

      /***********************************************************************
       * Tool-tip
       * TODO: Fix this is not working in angular
       ***********************************************************************/
      /*
       var tip = d3.tip()
       .attr('class', 'd3-tip')
       //.offset([0, 0])
       .html(function (d) {
       return "<center>"
       + "<font size='1'>"
       + "<span style='color:white' >"
       //+ d.w
       + "<span style='color:#ff7f0e'> <br> <i>Julie's query:</i> [<i>name:</i> building material, <i>type</i>: CAD, Document,  <i>size:</i> 500MB-2GB, <i>date:</i>] </br>"
       + "<span style='color:OrangeRed' > <br> [weight: 0.73] </br>"
       + "<span style='color:DodgerBlue' >"
       + "<br> <i>Charlotte's query:</i> [<i>name:</i> construction draft, <i>type:</i> CAD, <i>size:</i> 500MB-4GB, <i>date:</i> 26/01/2012 - 03/02/2015]"
       + "</span>"

       +"</font>"
       +"</center>";
       });
       svgGroup.call(tip);
       */


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
      //.on('mouseover', tip.show)
      //.on('mouseout', tip.hide)
        ;



      /***********************************************************************
       * Draw the dots.
       *
       ***********************************************************************/

      //var nodeColor = d3.scale.category10();
      var nodeColor = d3.scale.ordinal()
        .domain(["Charlotte", "Julie", "Andy", "Jane"])
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
       ***********************************************************************/

      console.log("legend", legend);

      var legendGroup = svgGroup.selectAll(".legend")
        .data(legend)
        .enter()
        .append("g");

      var r1 = r + LABEL * 2;

      /*
       * Arcs
       */

      // TODO This arrow is not working
      // build the arrow.
      // http://bl.ocks.org/d3noob/5141278
      legendGroup.append("defs").selectAll("marker")
        .data(["arrowhead"])      // Different link/path types can be defined here
        .enter().append("marker")    // This section adds in the arrows
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 37)           // adjust the position
        .attr("refY", -2.5)
        .attr("fill", "MediumSeaGreen")
        .attr("markerWidth", 100)
        .attr("markerHeight", 100)
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
      legendGroup.append("path")
        .attr("d", arcs)
        .attr("class", "ticks")
        .attr("id", function (d, i) {
          return "id" + i;
        });

      // Add the arrow
      legendGroup.attr("marker-start", "url(#arrowhead)");


      /*
       * User name labels
       * Aligning text inside circular arc d3js:
       *  http://stackoverflow.com/questions/13202407/aligning-text-inside-circular-arc-d3js
       */

      var textLegendGroup = legendGroup.append("g")
        .attr("id", "thing");

      textLegendGroup.append("text")
        .attr("class", "text")
        .style("font-size", LABEL + "px")
        .attr("dy", function (d, i) {
          return 15;                                    // TODO - radius position
        })
        .append("textPath")
        //.attr("textLength",function(d,i){return 90-i*5 ;})
        .attr("xlink:href", function (d, i) {
          return "#id" + i;
        })
        .attr("startOffset", function (d, i) {
          return 5 / 20;                                // TODO - where it will start
        })
        .text(function (d) {
          return d.user;
        });



      /***********************************************************************
       * Build the Arrow.
       * http://bl.ocks.org/d3noob/5141278
       ***********************************************************************/
      var edgeArrow = svgGroup.selectAll(".legend1")
        .data(links)
        .enter()
        .append("g");

      // TODO This arrow is not working
      edgeArrow.append("svg:defs").selectAll("marker1")
        .data(["edgearrow"])      // Different link/path types can be defined here
        .enter().append("svg:marker")    // This section adds in the arrows
        .attr("id", String)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 11)           // adjust the position
        .attr("refY", -0.0)
        .attr("fill", "rgb(6,120,155)")
        .attr("markerWidth", 8)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");

      var explicitLink = svgGroup.selectAll(".explicitlink")
        .data(links)
        .enter().append("path")
        .attr("d", diagonal)
        .attr("class", "link")
        .attr("stroke", function (d) {
          if (d.w == 1) {
            return edgeColor(d["w"]);
          }
        })
        //.on('mouseover', tip.show)
        //.on('mouseout', tip.hide)
        .attr("marker-end", function (d) {
          if(d.w == 1) {
            return "url(#edgearrow)";
          }
        });


    }// end radialGraph

      console.log("call function drawRadialGraph:");
      drawRadialGraph(DataService.getGraphData());

  }; // link


  return directive;
}]);

/**
 * Created by search-engine on 02/05/15.
 */

'use strict';

var enterpriseSearchApp = angular.module('enterpriseSearchApp');


/***************************************************************************************************************
 * Directive
 * fcgraph
 ****************************************************************************************************************/

enterpriseSearchApp.directive('fcgraph', ["$compile", "$window", "$rootScope", "DataService",
  function ($compile, $window, $rootScope, DataService) {

    var directive = {};
    directive.restrict = 'E';  // restrict this directive to elements

    console.log("fcgraph directive");

    directive.link = function ($scope, element, attributes) {


      var margin = {
        top: 10,
        right: 50,
        bottom: 10,
        left: 50
      };

      var canvasDim = {
        x: 0, // TODO check if using
        y: 0,

        width: function () {
          return $rootScope.fcgraphFrame.width - margin.left - margin.right;
        },
        height: function () {
          return $rootScope.fcgraphFrame.height - margin.top - margin.bottom;
        }
      };

      var MIN_WEIGHT = 0.1;

      var DOT_SIZE = 10;  // Diameter
      var MIN_GAP_X = DOT_SIZE;
      var MIN_GAP_Y = DOT_SIZE;

      var TIME_BREAK_WIDTH = 30;
      var ICON_SIZE = TIME_BREAK_WIDTH * 0.7;
      var LABEL_SIZE = ICON_SIZE / 2;

      var Y_OFFSET = canvasDim.height() / 4.5; // TODO: 4.5 set trial and error
      var SCALE_OFFSET = 25;

      var MAX_TIME = 1 * 60 * 60 * 1000;     // 1hr

      // SCALE
      var TSCALE_OFFSET = 25;
      var AXIS_POS_Y = Y_OFFSET * 2;
      var AXIS_OFFSET = 10;

      var TIME_LEGEND_FONT = 10;
      var FONT_LABEL = 12;

      var nodeMap = {};


      /***********************************************************************
       * Calculate X and Y
       *
       ***********************************************************************/

      var layout = {

        calcXPos: function calcXPos(nodes, focus, context, timeBreaks, dateScale, contextSession, minAllowedTimeDiff) {

          //console.log("calcXPos: function calcXPos:", nodes, focus, context, contextSession, minAllowedTimeDiff);
          var tempTime = new Date();

          for (var i = 0; i < nodes.length; ++i) {
            var xPos = 0;

            // First node
            if (i == 0) {
              xPos = 0;

            } else {
              // Second and other nodes
              var timeDiff = nodes[i].time - nodes[i - 1].time;

              // Draw glyph showing the difference
              if (timeDiff >= MAX_TIME) {
                xPos = nodes[i - 1].x + TIME_BREAK_WIDTH;

                timeBreaks.push({
                  x1: nodes[i - 1].x,
                  x2: xPos,
                  y: 0,
                  t1: nodes[i - 1].time,
                  t2: nodes[i].time,
                  timeDiff: timeDiff
                });

              } else {
                xPos = (timeDiff / minAllowedTimeDiff) * MIN_GAP_X + nodes[i - 1].x;
              }
            }
            nodes[i].x = xPos;

            // focus or context
            if (nodes[i].session == contextSession) {
              focus.push(nodes[i]);

            } else {
              context.push(nodes[i]);
            }

            nodeMap[nodes[i].id].x = xPos;
            //console.log(xPos);

            // Store the different dates value
            if (nodes[i].time.toDateString() != tempTime.toDateString()) {
              dateScale.push({
                time: nodes[i].time,
                x: xPos
              });
              //console.log(nodes[i].time.toDateString(), tempTime.toDateString());
            }
            tempTime = nodes[i].time;

          } // end for

        },


        calcYPos: function calcYPos(arg, contextSession) {


          for (var i = 0; i < arg.length; ++i) {
            if (i > 0 && arg[i].x - arg[i - 1].x < MIN_GAP_X) {
              arg[i].y = (arg[i].session == contextSession) ?
                this.optimalY(i, arg, 0, contextSession) : this.optimalY(i, arg, -Y_OFFSET, contextSession);
            } else {
              arg[i].y = (arg[i].session == contextSession) ? 0 : -Y_OFFSET;
            }
            //console.log(arg[i].id, ": ", Math.round(arg[i].x), ", ", arg[i].y);
            nodeMap[arg[i].id].y = arg[i].y;
          }
        },

        optimalY: function optimalY(i, arg, yScale, contextSession) {
          var j = i - 1;
          var y = arg[j].y - MIN_GAP_Y;

          //console.log(i, yScale, offset);
          //console.log("Target id=",arg[i].id, ": ", Math.round(arg[i].x), y);

          while (j >= 0) {
            //console.log("id=",arg[j].id, ": ", Math.round(arg[j].x), arg[j].y);

            if (arg[i].x - arg[j].x >= MIN_GAP_Y) {
              y = arg[j].y;
            }
            if (arg[j].y == yScale) {
              break;
            }
            j = j - 1;
          }
          return y;
        }

      };


      function drawFCGraph(graphData, contextSession) {

        console.log("function drawFCGraph:");

        var minAllowedTimeDiff;
        var timeDiffPerPixel;
        var nodes = [];
        var sessions = [];

        /***********************************************************************
         * SVG : the canvas should span through the margins also
         *
         ***********************************************************************/
        d3.select(element[0]).selectAll("*").remove();
        var svg = d3.select(element[0])
          .append("svg")
          .attr("x", canvasDim.x)
          .attr("y", canvasDim.y)
          .attr("width", canvasDim.width() + margin.left + margin.right)
          .attr("height", canvasDim.height() + margin.top + margin.bottom)
          .style("background", "none");

        var svgCanvas = svg.append("g")
          .attr("transform", "translate(" + margin.left + "," + canvasDim.height() / 2 + ")");


        /***********************************************************************
         * Find the minimum time gap between two queries of the search sessions.
         *
         ***********************************************************************/


        graphData.forEach(function (d, i) {

          var session = d.session;
          var user = d.user;
          var array = d.children;

          sessions.push({
            session: session,
            user: user
          });

          /*
           * Sort the queries in a session (array) by time.
           */
          array.sort(function (a, b) {
            var diff = new Date(a.time) - new Date(b.time);
            return diff;
          });

          /*
           * Create a map [key= node id : value= Node attributes]
           */
          array.forEach(function (c, i) {

            var key = c.id;
            var time = new Date(c.time);
            var query = (c.query ? c.query : "");

            //console.log("c=", c, "  , query=", query);

            nodeMap[key] = {
              session: session,
              time: time,
              adjList: c.adjList,
              x: 0,
              y: 0,
              meta: {},
              query: query
            };
            nodes.push({id: c.id, session: session, user: user, query: query, time: time, x: 0, y: 0});
          });
        });


        /***********************************************************************
         * Calculate the minimum offset time dynamically
         * Sort nodes by time
         *
         ***********************************************************************/

        nodes.sort(function (a, b) {
          return a.time - b.time;
        });

        //nodes.forEach(function (c, i) {
        //    console.log(c.id + " " + c.time);
        //});

        var totalTimeBreakWidth = 0;
        var totalTimeDiff = 0;

        for (var i = 1; i < nodes.length; ++i) {
          var timeDiff = nodes[i].time - nodes[i - 1].time;

          if (timeDiff >= MAX_TIME) {
            totalTimeBreakWidth += TIME_BREAK_WIDTH;
          } else {
            totalTimeDiff += timeDiff;
          }
        }

        timeDiffPerPixel = totalTimeDiff / (canvasDim.width() - totalTimeBreakWidth);
        minAllowedTimeDiff = timeDiffPerPixel * MIN_GAP_X;

        console.log("minAllowedTimeDiff= ", minAllowedTimeDiff, MAX_TIME, TIME_BREAK_WIDTH, canvasDim.width());

        /***********************************************************************
         * Compute the position (x, y)
         * Create three arrays : focus, context, contextDup
         * Create array of glyphs pos
         *
         ***********************************************************************/
        var focus = [];
        var context = [];
        var contextDup = [];
        var timeBreaks = [];
        var dateScale = [];
        /*
         * Layout
         */
        layout.calcXPos(nodes, focus, context, timeBreaks, dateScale, contextSession, minAllowedTimeDiff);
        layout.calcYPos(context, contextSession);
        layout.calcYPos(focus, contextSession);

        // Store the start and end time and position of first and last node
        var startTime = nodes[0].time;
        var endTime = nodes[nodes.length - 1].time;
        var startXPos = nodes[0].x;
        var endXPos = nodes[nodes.length - 1].x;

        /*
         * Create a duplicate (deep-copy) of context
         */
        var deepcopy = function (o) {
          return JSON.parse(JSON.stringify(context));
        };
        contextDup = deepcopy(context);

        contextDup.forEach(function (d, i) {
          contextDup[i].y = -contextDup[i].y;
        });

        // Concatenate context and duplicate context nodes
        nodes = [];
        nodes = context.concat(focus, contextDup);

        //console.log("nodes (after x, y)= ", nodes, ", focus= ", focus, ", context= ", context);
        //console.log("context= ", context, ", contextDup= ", contextDup);


        /***********************************************************************
         * Compute the links from focus nodes to context
         *
         ***********************************************************************/

        var links = [];
        focus.forEach(function (d, i) {

          var srcNode = nodeMap[d.id];
          var adjList = srcNode.adjList;


          adjList.forEach(function (d, i) {

            var dstNode = nodeMap[d.id];
            var w = d.w;
            var yPos;

            if (w > MIN_WEIGHT) {
              if (srcNode.x > dstNode.x) {
                yPos = dstNode.y;
              } else {
                yPos = -dstNode.y;
              }

              links.push({source: {x: srcNode.x, y: srcNode.y}, target: {x: dstNode.x, y: yPos}, w: w});
            }

          })

        });
        links.sort(function (a, b) {
          return a.w - b.w;
        });

        //console.log("links= ", links);


        /***********************************************************************
         * Draw the icons for timeBreaks
         *
         ***********************************************************************/

        var rectGroup = svgCanvas.selectAll(".icons")
          .data(timeBreaks)
          .enter()
          .append("g");


        rectGroup.append("rect")
          .attr("x", function (d) {
            return d.x1 + DOT_SIZE / 2;
          })
          .attr("y", function (d) {
            return d.y - AXIS_POS_Y;
          })
          .attr("width", TIME_BREAK_WIDTH - DOT_SIZE)
          .attr("height", 2 * AXIS_POS_Y)
          .style("fill", "MediumSeaGreen")
          .style("opacity", "0.25")
          .append("title").text(function (d) {
          return d.timeDiff;
        });

        rectGroup.append("svg:image")
          .attr("x", function (d) {
            return d.x1 + (TIME_BREAK_WIDTH - ICON_SIZE) / 2;
          })
          .attr("y", function (d) {
            return d.y - ICON_SIZE / 2;
          })
          .attr("xlink:href", function (d) {
            if (d.timeDiff >= MAX_TIME && d.timeDiff < MAX_TIME * 24) {
              return "../../app/mainpage/icons/clockIcon.svg";
            } else {
              return "../../app/mainpage/icons/dayIcon.svg";
            }
          })
          .attr("width", ICON_SIZE)
          .attr("height", ICON_SIZE);

        rectGroup.append("text")
          .attr("class", "text")
          .style("font-size", FONT_LABEL + "px")
          .attr("x", function (d) {
            return d.x1 + (TIME_BREAK_WIDTH) / 2;
          })
          .attr("y", function (d) {
            return d.y + ICON_SIZE / 4;
          })
          .text(function (d) {
            if (d.timeDiff >= MAX_TIME && d.timeDiff < MAX_TIME * 24) {
              return Math.round(d.timeDiff / MAX_TIME);
            } else {
              return Math.round(d.timeDiff / (MAX_TIME * 24));
            }
          });


        /***********************************************************************
         * Draw the links/edges
         *
         ***********************************************************************/

        //
        // tool-tip for links
        //
        var tipForLinks = d3.tip()
          .attr('class', 'd3-tip')
          //.offset([0, 0])
          .html(function (d) {
            return "<center>"
              + "<font size='2px'>"
              + "<span style='color:white' >"
              //+ d.w
              + "<span style='color:#ff7f0e'> <br> <i>Andy's</i> [building material | docx, pdf, xlsx, dwg | 100KB-500MB] </br>"
              + "<span style='color:OrangeRed' > <br> [weight: 1.0] </br>"
              + "<span style='color:DodgerBlue' >"
              + "<br> <i>Saiful's</i> [building material | docx, pdf | 100KB-500MB] </br>"
              + "</span>"
              + "</font>"
              + "</center>";
          });
        svgCanvas.call(tipForLinks);

        var diagonal = d3.svg.diagonal()
          .projection(function (d) {
            return [d.x, d.y];
          });

        var edgeColor = d3.scale.linear()
          .domain([MIN_WEIGHT, 0.99, 1.0])
          .range(["#fff", "#888888", "rgb(6,120,155)"]);

        var link = svgCanvas.selectAll(".link")
          .data(links)
          .enter().append("path")
          .attr("d", diagonal)
          .attr("class", "link")
          .attr("stroke", function (d) {
            //console.log("Weight: ", d.w);
            return edgeColor(d["w"]);
          })
          .on('mouseover', tipForLinks.show)
          .on('mouseout', tipForLinks.hide);
          //.append("title").text(function (d) {
          //  return d["w"];
          //});


        /***********************************************************************
         * Draw the nodes
         *
         ***********************************************************************/

        //var nodeColor = d3.scale.category10();
        var nodeColor = d3.scale.ordinal()
          .domain(["James", "Andy", "Emily", "Saiful"])
          .range(["DodgerBlue", "#2ca02c", "#9467bd", "#ff7f0e"]);

        var svgNodes = svgCanvas.selectAll(".circle")
          .data(nodes)
          .enter()
          .append("g");
        //.attr("class", "circle");

        //
        // tool-tip for nodes
        //
        var nodeInfoTip = d3.tip()
          .attr('class', 'd3-tip')
          //.offset([0, 0])
          .html(function (d) {
            //console.log("d:", d);
            var info = "[" + d.id +
              "]";
            if (d.query) {
              info += "\n" + d.query;
            }
            //console.log("info:", info);
            return info;

          });
        svgNodes.call(nodeInfoTip);

        svgNodes.append("circle")
          .attr("cx", function (d) {
            return d.x;
          })
          .attr("cy", function (d) {
            return d.y;
          })
          .attr("r", DOT_SIZE / 2)
          .style("fill", function (d) {
            return nodeColor(d.user);
          })
          /*.append("title")
           .text(function (d) {
           //console.log("d:", d);
           var info = d.id;
           if (d.query) {
           info += "\n" + d.query;
           }
           //console.log("info:", info);
           return info;
           })*/
          .on('mouseover', nodeInfoTip.show)
          .on('mouseout', nodeInfoTip.hide);


        /***********************************************************************
         * Draw the axis
         *
         ***********************************************************************/

        // Converts to d3 date object, the input datetime string format must follow the convention.
        // var parseDate = d3.time.format("%Y-%m-%d %H:%M:%S").parse;

        console.log("startTime: ", startTime, ", endTime: ", endTime);
        console.log("startXPos: ", startXPos, ", endXPos: ", endXPos);


        console.log(startTime);
        console.log(timeBreaks[0]);

        timeBreaks.unshift({
          x1: startXPos,
          x2: startXPos,
          y: 0,
          t1: startTime,
          t2: startTime,
          timeDiff: 0
        });

        console.log(timeBreaks[0]);

        timeBreaks.push({
          x1: endXPos,
          x2: endXPos,
          y: 0,
          t1: endTime,
          t2: endTime,
          timeDiff: 0
        });

        /*
         for (var i = 0; i < timeBreaks.length; ++i) {
         console.log(i, timeBreaks[i]);
         }
         console.log("#slece: ", timeBreaks.length, ", timeBreaks: ", timeBreaks);

         for (var i = 0; i < timeBreaks.length; ++i) {
         console.log(i, timeBreaks[i]);
         }*/


        /*
         * The times
         */

        var timeScale = [];

        console.log("dW: ", dW, ", noOfTicks: ", noOfTicks, ", timeDiffPerPixel", timeDiffPerPixel, ", dT(sec): ", dT / 1000);

        var dT = TSCALE_OFFSET * timeDiffPerPixel;

        for (var i = 0; i < timeBreaks.length - 1; i = i + 1) {

          console.log("i+1 = ", i + 1, ", i = ", i);
          console.log(timeBreaks[i + 1].x1, timeBreaks[i].x2);

          var dW = timeBreaks[i + 1].x1 - timeBreaks[i].x2;
          var noOfTicks = Math.floor(dW / TSCALE_OFFSET);

          var tempTime = timeBreaks[i].t2;
          var tempPos = timeBreaks[i].x2;
          for (var j = 0; j <= noOfTicks; ++j) {
            timeScale.push({
              x: tempPos,
              time: tempTime.getHours() + ":" + tempTime.getMinutes(),
              t: 5
            });
            console.log("tempTime: ", tempTime);
            tempPos = tempPos + TSCALE_OFFSET;
            tempTime.setMilliseconds(tempTime.getMilliseconds() + dT);
          }
        }

        console.log("timeScale:", timeScale);
        for (var i = 0; i < timeBreaks.length; ++i) {
          console.log(i, timeScale[i]);
        }


        // Line - axis
        var xAxisTimeGroup0 = svgCanvas.append('g');

        xAxisTimeGroup0.append("line")
          .attr("class", "ticks")
          .attr("x1", startXPos)
          .attr("y1", AXIS_POS_Y)
          .attr("x2", endXPos)
          .attr("y2", AXIS_POS_Y);

        var xAxisTimeGroup = xAxisTimeGroup0.append('g')
          .selectAll(".xaxistime")
          .data(timeScale)
          .enter().append("g");

        // Ticks - time - axis
        xAxisTimeGroup.append("line")
          .attr("stroke-width", 0.5)
          .attr("class", "ticks")
          .attr("x1", function (d) {
            //console.log(d.x)
            return d.x;
          })
          .attr("x2", function (d) {
            //console.log(d.x)
            return d.x;
          })
          .attr("y1", function (d) {
            return AXIS_POS_Y;        // TODO
          })
          .attr("y2", function (d) {
            return AXIS_POS_Y - 3;        // TODO
          });


        // Time labels
        xAxisTimeGroup.append("text")
          .attr("class", "text")
          .style("font-size", TIME_LEGEND_FONT + "px")
          .attr("x", function (d) {
            console.log(d.x)
            return d.x;
          })
          .attr("y", function (d) {
            return AXIS_POS_Y - 4;             // TODO
          })
          .text(function (d) {
            return d.time;
          });


        /*
         * The Dates
         */

        var xAxisDateGroup = svgCanvas.append('g')
          .selectAll(".xaxisdate")
          .data(dateScale)
          .enter().append("g");

        xAxisDateGroup.append("line")
          .attr("class", "ticks")
          .attr("x1", function (d) {
            //console.log(d.x)
            return d.x;
          })
          .attr("x2", function (d) {
            //console.log(d.x)
            return d.x;
          })
          .attr("y1", function (d) {
            return AXIS_POS_Y; // TODO
          })
          .attr("y2", function (d) {
            return AXIS_POS_Y + 4;  // TODO
          });

        console.log("dateScale: ", dateScale);

        // Dates
        xAxisDateGroup.append("text")
          .attr("class", "text")
          .attr("x", function (d) {
            console.log(d.x)
            return d.x;
          })
          .attr("y", function (d) {
            return AXIS_POS_Y + 8;             // TODO
          })
          .text(function (d) {
            return d.time.toDateString();
            //return d.time.toLocaleDateString();
          });

        /*
         * Legends for: Users sessions
         */
        var legendGroup = svgCanvas.append('g')
          .selectAll(".legend")
          .data(sessions)
          .enter().append("g");

        var x = [];
        var tw = [];
        var y = AXIS_POS_Y + 20;

        legendGroup.append("text")
          .attr("class", "text")
          .style("text-anchor", "start")
          .text(function (d, i) {
            return d.user;
          })
          .attr("x", function (d, i) {

            tw.push(this.getBBox().width)
            if (i == 0) {
              x[i] = canvasDim.width() / 2;
            } else {
              x[i] = x[i - 1] + tw[i - 1] + 2 * DOT_SIZE;
            }
            //console.log("Update: i=", i, ", textWidth=", tw[i], ", x[i]=", x[i]);
            return x[i];
          })
          .attr("y", function (d) {
            return y + DOT_SIZE / 2;
          })

        legendGroup.append("circle")
          .attr("cx", function (d, i) {
            return x[i] - DOT_SIZE;
          })
          .attr("cy", function (d) {
            return y;
          })
          .attr("r", DOT_SIZE / 2)
          .style("fill", function (d) {
            return nodeColor(d.user);
          });


      } // end drawFCGraph


      console.log("call drawFCGraph()... first");
      drawFCGraph(DataService.getGraphData(0), 4);

      /********************************************************************************************************
       * redraw the SPG-FC-Graph
       ********************************************************************************************************/
      $scope.$on('event:searchquery-received', function (event, args) {

        console.log("event:searchquery-received...",
          "\nqueryNumber: ", $rootScope.queryNumber, "\n");
        console.log("call drawFCGraph()...");
        drawFCGraph(DataService.getGraphData($rootScope.queryNumber), 4);
      });


    }; // link

    return directive;
  }]);

var resultGlyph = {

  // args// Arg
  svgCoordinate: {},
  selector: "",


  // Glyph
  glyphSize: 100,
  totalGrids: 25, // n x n
  gridDistance: 0.25,
  strokeWidth: 0.2,
  distanceX: 10,
  nodeCoordinate: new Array(), // [{"x":, "y"}, ..]

  svgCanvas: null,

  // Data/result. Empty 2D array is created.
  resultArray: new Array([]),
  lastComputedDataArray: new Array([]),

  /*
   * Stat [ [category, select], ]
   */
  fontSize: 9,
  statData: new Array({}),
  //statSelectData: new Array(),

  getGridSize: function () {
    return Math.sqrt((this.glyphSize * this.glyphSize) / this.totalGrids);
  },

  dotSize: function () {
    return this.getGridSize() / 10; // 5 times smaller than the grid
  },

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
        .attr("height", this.svgCoordinate.h)
        .attr("width", this.svgCoordinate.w)
        .style("background", "none");
        //.attr("transform", function(d) { return "translate(" + 0 + "," - this.svgCoordinate.h  + ")"; });

    }
    return this.svgCanvas;
  },

  // dataArray contains the computed data for each glyph representing each search result
  setLastComputedDataArray: function (arg) {
    this.lastComputedDataArray.push(arg);
  },

  getLastComputedDataArray: function () {
    return this.lastComputedDataArray[this.lastComputedDataArray.length - 1];
  },

  // resultArray array of arrays(each result is a array)
  setResultArray: function (result) {
    this.resultArray.push(result);
  },

  getLastResult: function () {
    return this.resultArray[this.resultArray.length - 1];
  }
};


/*********************************************************************************************************************
 * Every time new result will come from first window this will be called
 * 1. compute a, b, c, e.g, new/add, delete, common/same etc.
 * 2. update resultArray array
 * 3.
 **********************************************************************************************************************/

function processResult(data, selector, svgCoordinate) {

  //var result = JSON.parse(data); // string to object
  var result = data; // string to object
  resultGlyph.selector = selector;
  resultGlyph.svgCoordinate = svgCoordinate;

  console.log("processResult", resultGlyph.selector, resultGlyph.coordinates);

  function dbgPrint(name, array) {
    var str = "";
    for (var i = 0; i < array.length; ++i) {
      str += array[i]["docid"];
      str += "-";
      str += array[i]["fp"];
      str += ", ";
    }
    console.log(name, ":: (docid-fp)=", str)
  }


  /*
   * A : last result, and B = current result
   * Common   : A _intersection_ B
   * Deleted  : A - (A _intersection_ B)
   * Added/new: B - (A _common_ B)
   */

  function predEquals(o1, o2) {
    if (!o2) {
      return false;
    }
    if (o1["docid"] !== o2["docid"]) {
      return false;
    }
    return true;
  }

  var common = intersect(result, resultGlyph.getLastResult(), predEquals);
  dbgPrint("common: ", common);
  var deleted = diff(resultGlyph.getLastResult(), common, predEquals);
  dbgPrint("deleted: ", deleted);
  var added = diff(result, resultGlyph.getLastResult(), predEquals);
  dbgPrint("New/fresh: ", added);

  /*
   * Set the flag:
   * added/new = 0,
   * common/same = 1
   * deleted  = 2
   *
   * Count the documents in each of them are selected.
   */
  var selectInAdded = 0;
  var selectInCommon = 0;
  var selectInDeleted = 0;

  for (var i = 0; i < added.length; ++i) {
    added[i]["flag"] = 0;

    if (added[i]["select"]) {
      added[i]["fp"] = 0;
      ++selectInAdded;
    } else {
      added[i]["fp"] = 1;
    }
  }

  console.log("common:", common);
  for (var i = 0; i < common.length; ++i) {

    common[i]["flag"] = 1;

    if (common[i]["select"]) {
      // It is a true positive, even if it may be in last result.
      common[i]["fp"] = 0;
      ++selectInCommon;
    } else {
      // Cumulatively increase it's fp
      var lastFP = searchFP(common[i]["docid"], resultGlyph.getLastComputedDataArray());
      common[i]["fp"] = lastFP + 1;
    }
  }


  for (var i = 0; i < deleted.length; ++i) {
    deleted[i]["flag"] = 2;

    if (deleted[i]["select"]) {
      ++selectInDeleted;
    }
  }

  /*
   * computedData : currently computed data
   */
  var computedData = [];
  computedData.push.apply(computedData, added);
  computedData.push.apply(computedData, common);

  /*
   * visualiseData : the computed data and deleted(from last result)
   */
  var visualiseData = [];
  visualiseData.push.apply(visualiseData, computedData);
  visualiseData.push.apply(visualiseData, deleted);

  // sort by flags
  computedData.sort(function (a, b) {
    return (a["flag"] - b["flag"]);
  });

  dbgPrint("Computed data (sorted flag wise): ", computedData);
  dbgPrint("Visualize data (sorted flag wise): ", visualiseData);


  /*
   * Stat:
   *  Total [added, common, diff/deleted] docs
   *  Total selected docs in each of the three categories.
   */
  var total = visualiseData.length;
  resultGlyph.statData[0] = {
    "unselect": (added.length - selectInAdded) / total,
    "select": selectInAdded / total};

  resultGlyph.statData[1] = {
    "unselect": (common.length - selectInCommon) / total,
    "select": selectInCommon / total
  };

  resultGlyph.statData[2] = {
    "unselect": (deleted.length - selectInDeleted) / total,
    "select": selectInDeleted / total
  };

  console.log("statistics:", resultGlyph.statData);

  /*
   * Store the current result & computed data, to be used by next result to be visualised.
   */
  resultGlyph.setResultArray(result);
  resultGlyph.setLastComputedDataArray(computedData);

  drawResultGraph(visualiseData);
}


/*********************************************************************************************************************
 * Draw the graphs
 *********************************************************************************************************************/

function drawResultGraph(dataset) {

  console.log("drawResultGraph", dataset);

  var coordinate = {};
  var lastCoordinate = resultGlyph.getLastNodeCoordinate();
  if (Object.getOwnPropertyNames(lastCoordinate).length === 0) {
    coordinate["x"] =  resultGlyph.distanceX * 0.5;
    // TODO: position hardcoded for laptop = 15
    coordinate["y"] =  resultGlyph.distanceX * 0.5;
  } else {
    coordinate["x"] = lastCoordinate["x"] + resultGlyph.glyphSize + resultGlyph.distanceX;
    coordinate["y"] = lastCoordinate["y"];
  }
  resultGlyph.pushNodeCoordinate(coordinate);

  var svgCanvas = resultGlyph.getCanvas();
  var svg = svgCanvas.append("g")
    .attr("transform", "translate(" + coordinate["x"] + ", " + coordinate["y"] + ")");


  var glyphSize = resultGlyph.glyphSize;
  var gridSize = resultGlyph.getGridSize();
  var grids = Math.sqrt(resultGlyph.totalGrids);
  var dotSize = resultGlyph.dotSize();
  var offset = resultGlyph.strokeWidth;

  //console.log("Drawing dataset:", dataset);

  // boundary rect
  svg.append("rect")
    .attr("width", glyphSize + resultGlyph.gridDistance * 2)
    .attr("height", glyphSize + resultGlyph.gridDistance * 2)
    .attr("x", - resultGlyph.gridDistance)
    .attr("y", - resultGlyph.gridDistance)
    .style("fill", "none")
    .style("stroke", "#DDDAD6")
    .style("stroke-width", ".5px");

  if (dataset.length <= 25) {

    // grids
    svg.selectAll("grid")
      .data(dataset).enter()
      .append("rect")
      .attr("width", gridSize - resultGlyph.gridDistance * 2)
      .attr("height", gridSize - resultGlyph.gridDistance * 2)
      .attr("x", function (d, i) {
        var col = i % grids;
        var x = (col) * gridSize;
        return x + resultGlyph.gridDistance;
      })
      .attr("y", function (d, i) {
        var row = Math.floor(i / grids);
        var y = (row) * gridSize;
        return y + resultGlyph.gridDistance;
      })
      .style("fill", function (d, i) {
          return gridColor(d["flag"]);
      });


    // Selection / true positive
    svg.selectAll("tp")
      .data(dataset).enter()
      .append("circle")
      .attr("r", dotSize)
      .attr("cx", function (d, i) {
        var col = i % grids;
        var x = (col * gridSize) + (gridSize / 2);
        return x;
      })
      .attr("cy", function (d, i) {
        var row = Math.floor(i / grids);
        var y = (row * gridSize) + (gridSize / 2);
        return y;
      })
      .style("fill", function (d) {
        return d.select ? "red" : "none";
      });


    // FP

    svg.selectAll("fp")
      .data(dataset).enter()
      .append("rect")
      .attr("width", function(d) {
        return fpGridSize(d.fp);
      })
      .attr("height", function(d) {
        return fpGridSize(d.fp);
      })
      .attr("x", function (d, i) {
        var col = i % grids;
        var x = (col) * gridSize;
        return x + (resultGlyph.gridDistance + gridSize - fpGridSize(d.fp)) * 0.5;
      })
      .attr("y", function (d, i) {
        var row = Math.floor(i / grids);
        var y = (row) * gridSize;
        return y + (resultGlyph.gridDistance + gridSize - fpGridSize(d.fp)) * 0.5;
      })
      .style("fill", "white");

  } else {

    /*
     * Statistics
     */
    var statData = resultGlyph.statData;
    var barHeight = glyphSize / statData.length;
    var y_bar = 0;

    //console.log("statData: ", statData);
    // new, common, & deleted
    svg.selectAll("unselect_rect")
      .data(statData).enter()
      .append("rect")
      .attr("width", function (d, i) {
        var barWidth = glyphSize * d["unselect"];
        return barWidth;
      })
      .attr("height", barHeight)
      .attr("y", function (d, i) {
        var y_temp = y_bar;
        y_bar += barHeight;
        return y_temp;
      })
      .style("stroke", "white")
      .style("stroke-width", "0.5px")
      .style("fill", function (d, i) {
        return gridColor(i);
      })
      .append("title")
      .text(function (d, i) {
        return (d["unselect"] * 100).toFixed(0) + "%";
      });

    y_bar = 0;
    // selected
    svg.selectAll("select_rect")
      .data(statData).enter()
      .append("rect")
      .attr("width", function (d, i) {
        var barWidth = glyphSize * d["select"];
        return barWidth;
      })
      .attr("height", barHeight)
      .attr("y", function (d, i) {
        var y_temp = y_bar;
        y_bar += barHeight;
        return y_temp;
      })
      .attr("x", function (d, i) {
        return glyphSize * d["unselect"];
      })
      .style("stroke", "white")
      .style("stroke-width", "0.5px")
      .style("fill", "Tomato")
      .append("title")
      .text(function (d, i) {
        return (d["select"] * 100).toFixed(0) + "%";
      });

    /*
     * If barWidth > 50% of glyphSize : text inside
     * Else outside
     * Text inside white, & outside black
     */
    var y_text = 0;
    svg.selectAll("text")
      .data(statData).enter()
      .append("text")
      .attr("x", function (d, i) {
        var offset = 25;
        var barWidth = glyphSize * (d["unselect"] + d["select"]);
        //console.log("barWidth/glyphSize ", barWidth, "/", glyphSize);
        if (barWidth + offset > glyphSize * 0.5) {
          return barWidth - offset - 5; // text inside, need more space if the bar is 100%
        } else {
          return barWidth + offset;
        }
      })
      .attr("y", function (d) {
        var y_temp = y_text;
        y_text += barHeight;
        return y_temp + barHeight * 0.5;
      })
      .text(function (d, i) {
        var percentage = ((d["unselect"] + d["select"]) * 100).toFixed(0);
        if (percentage > 0) {
          return percentage + "%";
        }
      })
      .style("font-size", resultGlyph.fontSize + "px")
      .style("font-family", "Verdana")
      .style("fill", function(d) {
        var offset = 25;
        var barWidth = glyphSize * (d["unselect"] + d["select"]);
        if (barWidth + offset > glyphSize * 0.5) {
          return "white";
        } else {
          return "black";
        }
      })
      .style("font-weight", "bold");

  }


}

/********************************************************************************************************
 * field name: key, type, size, date
 * value: new/added = 0 , common/same = 1
 ********************************************************************************************************/

function gridColor(i) {
  switch (i) {
    case 0:
      return "rgb(169, 218, 142)"; // Amber: added/new
      break;
    case 1:
      return "rgb(190, 190, 190)"; // Smoke: same/common
      break;
    case 2:
      return "rgb(142, 178, 218)"; // Damian: deleted/removed/old
      break;
    default:
    // error TODO exception
  }
}


function fpGridSize(fp) {
  if (fp < 2) {
    return 0;
  } else if (fp == 2) {
    return 4;
  } else if (fp <= 4) {
    return 5;
  } else if (fp >= 5) {
    return 7;
  }
}


function searchFP(docid, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i]["docid"] === docid) {
      return array[i]["fp"];
    }
  }
  // error TODO exception
  console.log("DANGER: should be there!"); // TODO: assert
}


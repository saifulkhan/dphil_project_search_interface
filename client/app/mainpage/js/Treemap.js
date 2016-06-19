var treemapInit = {

  zoomTreemap: "",
  // arguments received
  treemapCoordinates: {},
  selector: "",
  data: "",

  // Treemap
  textSize: 9,
  textFont: "Courier",
  maxDepth: 4,       // For color shading
  textColor: "black",//"#b91d47",

  svgCanvas: null,
  treemapBuildCanvas: null,

  // Data
  resultArray: [],
  treemapBuildArray: [],
  treemapDepthArray: [],

  getCanvas: function (selector) {
    if (this.svgCanvas == null) {
      this.svgCanvas = d3.select(this.selector)
        .append("svg")
        .attr("height", this.treemapCoordinates.h + 60)
        .attr("width", this.treemapCoordinates.w + 60)
      //.attr("x", 60)
      //.attr("y", 60)
      //.attr("transform", "translate(120, 120)");
      //.style("background", "blue");
    }
    return this.svgCanvas;
  },

  // resultArray array of arrays(each result is a array)
  setResultArray: function (result) {
    this.resultArray.push(result);
  },

  getLastResult: function () {
    return this.resultArray[this.resultArray.length - 1];
  },

  //  array of arrays(each result is a array)
  setTreemapDepthArray: function (treemapDepth) {
    this.treemapDepthArray.push(treemapDepth);
  },

  // 0,1,2 is already there in treemapBuildArray, so when spin-box requests 3 means it need 0th index
  getTreemapDepthArray: function (depth) {
    return this.treemapDepthArray[depth - 3];
  }

  // TODO save treemapBuild

}; // treemapInit


/*
 * Generic interface
 */

function updateTreemapBuild(data, selector, coordinates, zoomTreemap) {

  console.log("updateTreemapBuild", data, selector, coordinates);

  treemapInit.data = data;
  treemapInit.treemapCoordinates = coordinates;
  treemapInit.selector = selector;
  treemapInit.zoomTreemap = zoomTreemap;

  // update or concatenate result
  //treemapInit.setResultArray(result);

  var svgCanvas = treemapInit.getCanvas();
  treemapInit.treemapBuildCanvas = svgCanvas.append("g");

  drawTreemap(data);
}


function drawTreemap(data) {

  console.log("drawTreemap");

  // TODO
  var textSize = treemapInit.textSize;
  var textFont = treemapInit.textFont;
  var treemapCanvas = treemapInit.treemapBuildCanvas;
  var maxDepth = treemapInit.maxDepth;

  var dirColor = ["#006d2c", "#2ca25f", "#66c2a4", "#b2e2e2"];
  // ["#005824", "#238b45", "#41ae76", "#66c2a4", "#99d8c9", "#ccece6"]; // maxDepth
  var fileColor = ["#9e9ac8", "#807dba", "#6a51a3", "#54278f"];
  // ["#3f007d", "#54278f", "#6a51a3", "#807dba", "#9e9ac8", "#bcbddc"];


  var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, 0])
    .html(function (d) {
      if (d.type == "") { // directory
        return "<strong  style='color:#ff0097'>Location:</strong> <span>" + d.path + "/" + d.name + "</span>";
      }
    });

  treemapCanvas.call(tip);

  treemapCanvas.selectAll("rect")
    .data(data).enter()
    .append("rect")
    .attr("x", function (d) {
      return d.x;
    })
    .attr("y", function (d) {
      return d.y;
    })
    .attr("width", function (d) {
      return d.w;
    })
    .attr("height", function (d) {
      return d.h;
    })
    .attr("name", function (d) {
      return d.name;
    })  // dbg
    .style("fill", function (d) {
      if (d.type) {
        //file
        return d.depth > maxDepth ? fileColor[maxDepth] : fileColor[d.depth];
      } else {
        // directory
        return d.depth > maxDepth ? dirColor[maxDepth] : dirColor[d.depth];
      }
    })
    .style("stroke", function (d) {
      if (d.depth - 1 >= 0) {
        return dirColor[d.depth - 1];
      } else {
        return dirColor[d.depth];
      }
    })
    .style("stroke-width", "0.2")
    .on('mouseover', function (d, i) {

      d3.select(this).transition().duration(300)
        .style({'stroke-opacity': 1, 'stroke': '#ff0097', 'stroke-width' : '2'});
      return tip.show(d);
    })
    .on('mouseout', function (d, i) {

      d3.select(this).transition().duration(300)
        .style({'stroke-opacity': 0.4, 'stroke': '#eee'});
      return tip.hide(d);
    })
    .on('click', function (d) {
      if (d.type == "") { // directory
        treemapInit.zoomTreemap(d.path + "/" + d.name);
      }
    });

  // Labels
  treemapCanvas.selectAll("text")
    .data(data).enter()
    .append("text")
    .attr("x", function (d) {
      return d.x;
    })
    .attr("y", function (d) {
      return d.y;
    })
    .attr("dy", "1.0em")
    .text(function (d) {
      // add text first then check if fits
      return d.name;
    })
    .style("font-size", (textSize + "px"))
    .style("font-family", textFont)
    .text(function (d) {
      // check if it is big or small, then modify it
      return (this.getBBox().width < d.w) && (this.getBBox().height < d.h) ? d.name : " "; //TODO
    })
    .style("fill", treemapInit.textColor);


}

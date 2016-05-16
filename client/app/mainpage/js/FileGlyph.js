var fsglyphInit = {

  // arguments received
  treemapCoordinates: {},
  selector: "",
  data: "",

  // Glyph
  glyphSize: 40,
  dotSize: 3,
  dateRingSize: 34,
  dateRingWidth: 3,
  spiralSize: 27,

  // Data
  resultArray: [],
  treemapBuildArray: [],
  treemapDepthArray: [],

  // canvas
  svgCanvas: null,
  glyphCanvas: null,
  withTreemap: true,

  getCanvas: function (selector) {
    if (this.svgCanvas == null) {
      /*
       * When integrated with treemap use the existing treemap canvas.
       */
      if (this.withTreemap) {
        this.svgCanvas = d3.select(this.selector).select("svg");
      } else {
        this.svgCanvas = d3.select(this.selector)
          .append("svg")
          .attr("height", this.treemapCoordinates.h)
          .attr("width", this.treemapCoordinates.w)
          .attr("x", this.treemapCoordinates.x)
          .attr("y", this.treemapCoordinates.y)
          .style("background", "blue");
      }
    }

    return this.svgCanvas;
  },

  // resultArray array of arrays(each result is a array)
  setResultArray: function (result) {
    this.resultArray.push(result);
  },

  getLastResult: function () {
    return this.resultArray[this.resultArray.length - 1];
  }

}; // fsglyphInit


/*********************************************************************************************************************
 * generic interface
 *********************************************************************************************************************/

function updateFSGlyph(data, selector, coordinate) {

  console.log("updateFSGlyph", data, selector, coordinate);

  fsglyphInit.data = data;
  fsglyphInit.treemapCoordinates = coordinate;
  fsglyphInit.selector = selector;


  var svgCanvas = fsglyphInit.getCanvas();


  // Delete if there to redraw new result

  if (fsglyphInit.glyphCanvas) {
    console.log("New search result came so delete the last appended group from the canvas!");
    fsglyphInit.glyphCanvas.remove();
  }

  console.log("Appended group to the canvas!");

  fsglyphInit.glyphCanvas = svgCanvas.append("g");

  // update or concatenate result
  fsglyphInit.setResultArray(fsglyphInit.data);
  drawFSGlyph(fsglyphInit.data);
}

/*********************************************************************************************************************
 * Draw the fs graphs
 *********************************************************************************************************************/

function drawFSGlyph(data) {

  console.log("drawGlyph");

  var glyphCanvas = fsglyphInit.glyphCanvas;
  var glyphSize = fsglyphInit.glyphSize;
  var dotSize = fsglyphInit.dotSize;
  var dateRingSize = fsglyphInit.dateRingSize;
  var dateRingWidth = fsglyphInit.dateRingWidth;
  var spiralSize = fsglyphInit.spiralSize;

  /*
   * Draw glyph for each data point (document).
   */
  for (var i = 0; i < data.length; ++i) {

    var svg = glyphCanvas.append("g")
      .attr("transform", "translate(" + data[i].x + ", " + data[i].y + ")");

    svg.append("path")
      .attr("d", dateRing())
      .style("fill", "Silver")
      .style("opacity", 0.6);

    svg.append("path")
      .attr("d", pie(data[i].size))
      .style("fill", "orange");

    svg.append("path")
      .attr("d", ageArc(data[i].age))
      .style("fill", "cyan");

    // draw spiral separately in a function
    spiral(svg, data[i].date);

    svg.append("path")
      .attr("d", dot())
      .style("fill", function () {
        return colorDot[data[i].type];
      });

    svg.append("title")
      .text("Name: " + data[i].name + ", Type: " + data[i].type + ", Size: " + data[i].size + ", Date: " + data[i].date);
  }

  function outerRing() {
    var ring = d3.svg.arc()
      .innerRadius(glyphSize * 0.5 - 1)
      .outerRadius(glyphSize * 0.5)
      .startAngle(0)
      .endAngle(2 * Math.PI);
    return ring;
  }

  function dateRing() {
    var dateRing = d3.svg.arc()
      .innerRadius(dateRingSize * 0.5 - dateRingWidth)
      .outerRadius(dateRingSize * 0.5)
      .startAngle(0)
      .endAngle(2 * Math.PI);
    return dateRing;
  }

  function dot() {
    var dot = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(dotSize)
      .startAngle(0)
      .endAngle(2 * Math.PI);
    return dot;
  }

  /*
   * Visual mapping of size attribute
   */
  function pie(size) {
    var token = size.split(" ");

    var radiusScale = d3.scale.linear()
      .domain([0, 1024])
      .range([0, glyphSize * 0.5]);

    var coordinateScale = d3.scale.ordinal()
      .domain(["B", "KB", "MB", "GB"])
      .range([0.1 * Math.PI, 0.6 * Math.PI, 1.1 * Math.PI, 1.6 * Math.PI]);

    var radius = radiusScale(parseInt(token[0]));
    var startAngle = coordinateScale(token[1]);
    var endAngle = startAngle + (0.4 * Math.PI) ;

    var pie = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(radius)
      .startAngle(startAngle)
      .endAngle(endAngle);

    return pie;
  }

  /*
   * Visual mapping of date attribute
   */
  function ageArc(date) {
    var token = date.split(" ");

    var coordinateScale = d3.scale.ordinal()
      .domain(["D", "M", "Y", "DE"])
      .range([0, 0.5 * Math.PI, 1.0 * Math.PI, 1.5 * Math.PI]);

    var dayScale = d3.scale.linear()
      .domain([1, 29])
      .range([0, 0.5 * Math.PI]);

    var monthScale = d3.scale.linear()
      .domain([1, 11])
      .range([0, 0.5 * Math.PI]);

    var yearScale = d3.scale.linear()
      .domain([1, 10])
      .range([0, 0.5 * Math.PI]);

    var decadeScale = d3.scale.linear()
      .domain([1, 3])       // 3 decade is considered
      .range([0, 0.5 * Math.PI]);

     //console.log("date: ", date);

    var startAngle = coordinateScale(token[1]);

    var angle;
    if (token[1] == "D") {
      angle = dayScale(token[0]);
    }  else if(token[1] == "M") {
      angle = monthScale(token[0]);
    } else if (token[1] == "Y") {
      angle = yearScale(token[0]);
    } else if (token[1] == "DE") {
      angle = decadeScale(token[0]);
    } else {
      angle = 0;
    }
    //console.log("startAngle: ", startAngle, ", angle:", angle);

    var endAngle = startAngle + angle;

    var arc = d3.svg.arc()
      .innerRadius(dateRingSize * 0.5 - dateRingWidth)
      .outerRadius(dateRingSize * 0.5)
      .startAngle(startAngle)
      .endAngle(endAngle);
    return arc;
  }


  /*
   * Visual mapping of time attribute
   */
  function spiral(svg, date) {

    // e.g., date:  2014-03-18T11:05:47 , hour:  11
    var time = date.split("T")[1];
    var hour = time.split(":")[0];

    var timeScale = d3.scale.linear()
      .domain([0, 23])
      .range([1, 0]);

    // [0-1], decides the percentage of the spiral will be displayed.
    var span = timeScale(hour);
    //console.log("date: ", date, ", time: ", hour, ", span: ", span);


    var start = 0,
        end = 1,
        r_max = spiralSize * 0.5;
    r_min = r_max - 6;


    var scaling = 1000;
    var pieces = d3.range(start + (1 / scaling), end + (1 / scaling) - span, (end - start) / scaling);

    var color = d3.scale.linear()
      .domain([0, 0.2, 0.4, 0.8, 1.0])
      .range(["black", "orange", "yellow", "cyan", "black"]);

    var colorMap = function (index) {
      return color(index);
    }

    // [0..1] => [r_min .. r_max]
    var radius = d3.scale.linear()
      .domain([start, end])
      .range([r_min, r_max]);

    // [0..1] => [0+ .. 4pi]
    var theta = function (d) {
      var angle = (4 * Math.PI) * d;
      return angle;
    };

    var spiral = d3.svg.line.radial()
      .interpolate("cardinal")
      .angle(function (d) {
        return theta(d);
      })
      .radius(function (d) {
        return radius(d);
      });


    /*
     // Debug statement
     console.log("pieces: " + pieces.length + " : " + pieces);
     for (var i = 0; i < 100; ++i) {
     console.log("r    : " + radius(pieces[i]));
     console.log("theta: " + theta(pieces[i]));
     }
     console.log("spiral: " + spiral(pieces));
     */


    svg.append("path").datum(d3.range(50))
      .attr("class", "line")
      .attr("d", spiral(pieces));


    svg.selectAll(".spiral")
      .data(pieces).enter().append("path")
      .attr("d", function (d) {
        return spiral([d, d + 1 / scaling]);
      })// TODO: need two points
      .attr("stroke", function (d) {
        return color(d)
      })
      .attr("fill", "none")
      .attr("stroke-width", "1.5px");
  }

}


/*
 * The pie representing the size attribute
 */

var colorDot = {
  "Document": "Black",
  "Spreadsheet": "Blue",
  "Presentation": "Brown",
  "Audio": "Crimson",
  "Video": "Cyan",
  "Image": "DarkBlue",
  "Database": "HotPink",
  "Executable": "Red",
  "Web": "DeepPink",
  "System": "OrangeRed",
  "Compressed": "SaddleBrown",
  "DiskImage": "Violet",
  "Developer": "Yellow",
  "CAD": "Gold",
  "Backup": "DarkSalmon",
  "Misc": "DarkOrange"
};

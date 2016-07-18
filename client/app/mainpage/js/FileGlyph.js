var init = {

  // arguments received
  treemapCoordinates: {},
  selector: "",
  data: "",

  // Glyph
  GLYPH_SIZE: 50,
  PI_SIZE: 25,
  DOT_SIZE: 3,
  DATE_RING_SIZE: 40,
  DATE_RING_WIDTH: 3,
  SPIRAL_SIZE: 30,

  GLYPH_SIZE_L: 75,
  PI_SIZE_L: 50,
  DOT_SIZE_L: 5,
  DATE_RING_SIZE_L: 60,
  DATE_RING_WIDTH_L: 4,
  SPIRAL_SIZE_L: 45,

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

}; // init


/*********************************************************************************************************************
 * generic interface
 *********************************************************************************************************************/

function updateFSGlyph(data, selector, coordinate) {

  console.log("updateFSGlyph", data, selector, coordinate);

  init.data = data;
  init.treemapCoordinates = coordinate;
  init.selector = selector;


  var svgCanvas = init.getCanvas();


  // Delete if there to redraw new result

  if (init.glyphCanvas) {
    console.log("New search result came so delete the last appended group from the canvas!");
    init.glyphCanvas.remove();
  }

  console.log("Appended group to the canvas!");

  init.glyphCanvas = svgCanvas.append("g");

  // update or concatenate result
  init.setResultArray(init.data);
  drawFSGlyph(init.data);
}

/*********************************************************************************************************************
 * Draw the fs graphs
 *********************************************************************************************************************/

function drawFSGlyph(data) {

  console.log("drawGlyph");

  var glyphCanvas = init.glyphCanvas;

  if (data.length < 100) { // large glyph
    var GLYPH_SIZE = init.GLYPH_SIZE_L;
    var DOT_SIZE = init.DOT_SIZE_L;
    var DATE_RING_SIZE = init.DATE_RING_SIZE_L;
    var DATE_RING_WIDTH = init.DATE_RING_WIDTH_L;
    var SPIRAL_SIZE = init.SPIRAL_SIZE_L;
    var PI_SIZE = init.PI_SIZE_L;
  } else {
    var GLYPH_SIZE = init.GLYPH_SIZE;
    var DOT_SIZE = init.DOT_SIZE;
    var DATE_RING_SIZE = init.DATE_RING_SIZE;
    var DATE_RING_WIDTH = init.DATE_RING_WIDTH;
    var SPIRAL_SIZE = init.SPIRAL_SIZE;
    var PI_SIZE = init.PI_SIZE;
  }


  var tooltip = d3.tip()
    .attr('class', 'd3-tip')
    //.offset([0, 0])
    .html(function (d, i) {
      return d;

    });
  glyphCanvas.call(tooltip);


  /*
   * Draw glyph for each data point (document).
   */
  for (var i = 0; i < data.length; ++i) {

    var svg = glyphCanvas.append("g")
      .attr("transform", "translate(" + data[i].x + ", " + data[i].y + ")");

    svg.append("path")
      .attr("d", datePlue())
      .style("fill", "silver")
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
      })

    svg.append("title")
      .text("Name: " + data[i].name + ", Type: " + data[i].type + ", Size: " + data[i].size + ", Date: " + data[i].date)
      .style("font-size", "12px");

    //svg.on('mouseover', tooltip.show)
    //.on('mouseout', tooltip.hide);
  }

  function outerRing() {
    var ring = d3.svg.arc()
      .innerRadius(GLYPH_SIZE * 0.5 - 1)
      .outerRadius(GLYPH_SIZE * 0.5)
      .startAngle(0)
      .endAngle(2 * Math.PI);
    return ring;
  }

  function datePlue() {
    var dateRing = d3.svg.arc()
      .innerRadius(DATE_RING_SIZE * 0.5 - DATE_RING_WIDTH)
      .outerRadius(DATE_RING_SIZE * 0.5)
      .startAngle(0)
      .endAngle(2 * Math.PI);
    return dateRing;
  }

  function dot() {
    var dot = d3.svg.arc()
      .innerRadius(0)
      .outerRadius(DOT_SIZE)
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
      .domain([1, 1024])
      .range([PI_SIZE/3, PI_SIZE]);

    var coordinateScale = d3.scale.ordinal()
      .domain(["B", "KB", "MB", "GB"])
      .range([0.1 * Math.PI, 0.6 * Math.PI, 1.1 * Math.PI, 1.6 * Math.PI]);

    var radius = radiusScale(parseInt(token[0]));
    var startAngle = coordinateScale(token[1]);
    var endAngle = startAngle + (0.4 * Math.PI);

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
    } else if (token[1] == "M") {
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
      .innerRadius(DATE_RING_SIZE * 0.5 - DATE_RING_WIDTH)
      .outerRadius(DATE_RING_SIZE * 0.5)
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
      r_max = SPIRAL_SIZE * 0.5;
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
  "Document": "Cyan",
  "Spreadsheet": "Blue",
  "Presentation": "Brown",
  "Audio": "Crimson",
  "Video": "White",
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

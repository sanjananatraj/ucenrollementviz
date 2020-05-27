/*
File: ucenrollment.js
Constructs a streamgraph based on UC Undergraduate Enrollment numbers
from 1961-2009. Includes all UCs except for UCSF. Built using
d3.js V5. 

Data source: https://accountability.universityofcalifornia.edu/2010/index/1

Much of the code comes from
https://www.d3-graph-gallery.com/graph/streamgraph_template.html
I changed the version to v5, removed the commas from the x-axis, changed the color
scheme, and formatted the code to suit the UC enrollment data.
*/

// set the dimensions and margins
var margin = {top: 20, right: 30, bottom: 0, left: 80},
    width = 1060 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

// append the svg object to the body of the page
var svg = d3.select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// parse the data
d3.csv("ucenrollmentdata.csv").then(function(data) {

  // grab all the UC names and store them here
  var keys = data.columns.slice(1)

  // add x axis
  var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.year; }))
    .range([ 0, width ]);
  
  /* create x axis svg element. manually putting in the 
     ticks to get the specific range, every 10 years (9)
     years for the first and last range. format "d" to
     tell d3 it's years. use select statement to get
     rid of horizontal black axis line.
  */
    
   svg.append("g")
    .attr("transform", "translate(0," + height*.98 + ")")
    .call(d3.axisBottom(x)
    .tickSize(-height*1.7)
    .tickValues([1961, 1970, 1980, 1990, 2000, 2009])
    .tickFormat(d3.format("d")))
    .select(".domain").remove()
  
   // customize the x axis lines
  svg.selectAll(".tick line").attr("stroke", "#b8b8b8")

  // add x axis label
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width-50)
      .attr("y", height-5 )
      .style("fill", "white")
      .style("font-family", "sans-serif")
      .text("Time (year)");

  // add y axis
  var y = d3.scaleLinear()
    .domain([-100000, 100000])
    .range([ height, 0 ]);

  // color palette
  var color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeRdPu[9]);

  /* stack the data? yes! this is the main factor.
     d3.stack() lets us stack our data on top of each
     other. it computes the positions our data can
     go, and we use an area generator to actually
     position them.
     
     I'm using d3.stackOffsetWiggle. which shifts the
     baseline to minimize the wiggles of our layers,
     which is recommended for streamgraphs.
     
     Also, I'm using the inside-out order, as that is
     another characteristic that streamgraphs have. What
     this means is that the earliest series (max value)
     are on the inside.
  */
  var stackedData = d3.stack()
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)
    .keys(keys)
    (data)

  // create a tooltip to display the uni names
  var tooltip = svg
    .append("text")
    .attr("x", 5)
    .attr("y", 0)
    .style("opacity", 0)
    .style("font-size", 20)
    .style("fill", "white")
    .style("font-family", "sans-serif");
    
  /* three functions that change the tooltip when user 
   hovers / moves / leaves a cell */
  
  /*
    on mouseover, dim the other layers and outline
    the highlighted layer
  */
  var mouseover = function(d) {
    tooltip.style("opacity", 1)
    d3.selectAll(".myArea").style("opacity", .2)
    d3.select(this)
      .style("stroke", "#121212")
      .style("opacity", 1)
  }
  
  //display the university name  
  var mousemove = function(d,i) {
    grp = keys[i]
    tooltip.text(grp)
  }
  
  //return graph back to normal after mousing away
  var mouseleave = function(d) {
    tooltip.style("opacity", 0)
    d3.selectAll(".myArea").style("opacity", 1).style("stroke", "none")
    toolvalues.style("opacity", 0)
   }

  /*
    here, we're creating an area generator! to do this, we need to
    define the two bounding lines of the entire area. these two lines
    share the same x values, but differ in the y-values (the top and
    the bottom line). the baseline is x and y0, and is computed here.
    
    our x line is our years, so we define the line based on that, based
    on our x-scale. d[0] and d[1] is our actual data, so we scale that 
    as well.
  */
  var area = d3.area()
    .x(function(d) { return x(d.data.year); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })

  // show the areas
  svg
    .selectAll("mylayers")
    .data(stackedData)
    .enter()
    .append("path")
      .attr("class", "myArea")
      .style("fill", function(d) { return color(d.key); })
      .attr("d", area)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseleave", mouseleave)
}); //end of d3.csv

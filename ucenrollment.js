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

// set the dimensions and margins for the graph
var margin = {top: 20, right: 30, bottom: 0, left: 80},
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

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
  console.log(keys);

  // add x axis
  var x = d3.scaleLinear()
    .domain(d3.extent(data, function(d) { return d.year; }))
    .range([ 0, width ]);
  
  /* create x axis svg element (white lines). manually putting in the ticks to get the specific range, every 10 years (9) years for the first and last range. format "d" to tell d3 it's years. use select statement to get rid of horizontal black axis line.
  */
    
   svg.append("g")
    .attr("transform", "translate(0," + height*.85 + ")")
    .call(d3.axisBottom(x)
    // negative height to cover entire graph
    .tickSize(-height*1.1) 
    .tickValues([1961, 1970, 1980, 1990, 2000, 2009])
    .tickFormat(d3.format("d")))
    .select(".domain").remove()
  
   // customize the x axis lines
  svg.selectAll(".tick line").attr("stroke", "#b8b8b8")

  // add x axis label
  svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width-390)
      .attr("y", height-50 )
      .style("fill", "white")
      .style("font-family", "sans-serif")
      .text("Time (year)");

  /*// add y axis. the huge domain is because
     our stacked data streams are very large
     in size, so the bigger the domain, the
     smaller they will appear.*/
  var y = d3.scaleLinear()
    .domain([-100000, 100000])
    .range([ height, 0 ]);

  // color palette
  var color = d3.scaleOrdinal()
    .domain(keys)
    .range(d3.schemeRdPu[9]);

  /* 
     Here is where we stack our data, using our keys and our values. To do this, we set a variable (called stackedData) = to d3.stack().
     
     d3.stack()
     -------------------------------------
     d3.stack() is a command that takes an array and computes a baseline; then, the baseline is propagted to the above layers. What that means is that d3.stack() takes an array of data, figures out the baseline layer (the bottom of the lowest layer), then spreads the baseline to the rest of the layers, producing a stacked graph.
     Layers can be stacked vertially or horizontally. 
     
     d3.stackOffsetWiggle()
     -------------------------------------
     We use an offset especially for streamgraphs, as shown in the .offset property. d3.stackOffsetWiggle attempts to minimize changes in the slope, which is weighted by layer thickness. Layer thickness is important because it is the sum of all the values in the graph at that point.
     In simple terms, this offset makes the graph curvy. 
    
     d3.stackOrderInsideOut()
     -------------------------------------
     Sets the stack order of our layers to a specified value. I'm using inside-out order because that is what is recommended for streamgraphs. Inside-out sorts by the index of the max value, then it uses balanced weighting to figure out the other layers. The max value is on the "inside" of the graph, and the later ones are on the outside.
     
     Doing this allows the series with the biggest burst in the layers on the outside of the graph, which distrupts the other layers the least. 
     
  */
  var stackedData = d3.stack()
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)
    .keys(keys)
    (data)

  // create a tooltip to display the uni names on mouseover
  var tooltip = svg
    .append("text")
    .attr("x", 5)
    .attr("y", 0)
    .style("opacity", 0)
    .style("font-size", 20)
    .style("fill", "white")
    .style("font-family", "sans-serif");
    
  /* three functions that change the tooltip when user hovers / moves / leaves a cell */
  
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
   }

  /*
    We can't use d3.stack() without d3.area(). d3.area() produces an area chart, which is what is a streamgraph is.
    
    d3.area()
    -------------------------------------
    To get an area chart, we need to use this command, d3.area(), which is defined by two bounding lines (a topline and a baseline). These lines tell us what our area looks like and what to fill in. 
    These two lines usually share the same x-values (meaning, they're the same length), but differ in y-values (the vertical position of the lines are obviously different!). 
    
    To use d3.area(), we first get a variable assigned to it. We then need to set its attributes: x, y0 (the baseline), and y1 (the topline). These three arguments help create the area generator. 
    
    area.x(): sets the x0 baseline to these values. In this case, our x is the years, based on our x-scale. It is the x positions of our lines on the x-axis.
    
    area.y0(): sets y0 to this function. here, we're taking the y positions of our bottom line.
    
    area.y1(): sets the y1 accessor to the specified function. In this case, these are the y positions of the bottom lines.
    
  */
  var area = d3.area()
    .x(function(d) { return x(d.data.year); })
    .y0(function(d) { return y(d[0]); })
    .y1(function(d) { return y(d[1]); })
  

  // show the areas via SVG. Use our color scale to color each layer, and add the previously defined mouse movements for the tooltip. 
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

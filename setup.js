
//====================================================================

var filter;
var poiDimension;
var poiGrouping;
var decadeDimension;
var decadeGrouping;

var slpDateFormat = d3.time.format('%d-%b-%Y');
var poiDates = [];

var dateFormat = d3.time.format('%Y%m%d');

//http://www.colourlovers.com/palette/3860796/Melting_Glaciers
var decadeColours = d3.scale.ordinal()
    .range(["#67739F", "#67739F", "#67739F", "#67739F", "#B1CEF5", 
            "#B1CEF5", "#B1CEF5", "#B1CEF5"]);


// fitChart vars
var corrRange = [-0.15, 1.0];
var disRange = [-1500, -250.0];
var corrBinWidth = 0.1, disBinWidth = 100.;
//====================================================================
function init() {

//d3.tsv("analogues_reformat_all_select.json", function(data) {
d3.tsv("analogues_reformat_all.json", function(data) {  
    
  data.forEach(function (d, idx) {

    d.dateRef = dateFormat.parse(d.dateRef);  //resolution = day
    d.Dis = +d.Dis;
    d.Corr = +d.Corr;

    yr = parseInt(d.dateAnlg.substring(0, 4));

    if (yr >= 1948 && yr <= 1955) d.dateAnlg = "1948-1955";
    else if (yr >= 1956 && yr <= 1965) d.dateAnlg = "1956-1965";
    else if (yr >= 1966 && yr <= 1975) d.dateAnlg = "1966-1975";
    else if (yr >= 1976 && yr <= 1985) d.dateAnlg = "1976-1985";
    else if (yr >= 1986 && yr <= 1995) d.dateAnlg = "1986-1995";
    else if (yr >= 1996 && yr <= 2005) d.dateAnlg = "1996-2005";
    else if (yr >= 2006 && yr <= 2015) d.dateAnlg = "2006-2015";
    
    //bin correlation and distance
    d.Corr = d3.format(",.1f")(corrBinWidth*Math.round( d.Corr/corrBinWidth ));
    d.Dis = disBinWidth*Math.round( d.Dis/disBinWidth );
    
  });  
  points=data;

  initCrossfilter();

  // Render the total.
  d3.selectAll("#total")
    .text(filter.size());

  update1();
  
});

}

//====================================================================
function initCrossfilter() {


  //-----------------------------------
  filter = crossfilter(points);
 
  //-----------------------------------
  poiDimension = filter.dimension( function(d) {
    return d.dateRef; //resolves to the day    
  });
  poiDayGrouping = poiDimension.group();
  poiGrouping = poiDimension.group(function(d) {
    return d3.time.month(d); //resolves to the month
  });

  //-----------------------------------  
  decadeDimension = filter.dimension(function(d) {    
    return d.dateAnlg;
  });
  decadeGrouping = decadeDimension.group();

  //-----------------------------------  
  fitDimension = filter.dimension(function(d) {    
    return [d.Dis, d.Corr]; //[x, y]
  });
  fitGrouping = fitDimension.group();

  //-----------------------------------
  poiChart  = dc.barChart("#chart-poi");  
  decadeChart  = dc.rowChart("#chart-decade");
  fitChart = dc.scatterPlot("#chart-fit");  

  //-----------------------------------
  //https://github.com/dc-js/dc.js/wiki/Zoom-Behaviors-Combined-with-Brush-and-Range-Chart
  var currentGranularity = 'month';
  var saveLevel = 0;
  var init_domain0 = dateFormat.parse("21000101"), init_domain1 = dateFormat.parse("2100101");
  poiChart
    .width(780)
    .height(200)    
    .margins({top: 10, right: 20, bottom: 30, left: 40})  
    .mouseZoomable(true) 
    //.brushOn(false)    
    .dimension(poiDimension)
    .group(poiGrouping)
    .transitionDuration(500)
    .centerBar(true)    
    .filter(dc.filters.RangedFilter(dateFormat.parse("20130101"), dateFormat.parse("20131231")))
    //.filter(dc.filters.RangedFilter(dateFormat.parse("19500101"), dateFormat.parse("19510130")))
    .gap(10)    
    .x(d3.time.scale().domain(d3.extent(points, function(d) {
      return d.dateRef; 
    })))    
    .elasticY(true) 
    .elasticX(false)
    .renderHorizontalGridLines(true)    
    .on("filtered", getBrushDates)
    .on('zoomed', function(chart, filter) {

      deltaYear = chart.filters()[0][1].getFullYear() - chart.filters()[0][0].getFullYear();

      //handle weird case where zoom is stuck at same deltaYear 
      //while user keeps zooming out
      if (saveLevel - deltaYear === 0) {
        //only reset to default domain when no change in domain is happening at either ends
        if ( init_domain0.getTime() === chart.filters()[0][0].getTime() &&
            init_domain1.getTime() === chart.filters()[0][1].getTime() ) {
          chart.x().domain(chart.xOriginalDomain());
          // dc.refocusAll()
          // chart.filterAll();
          chart.render();
        }
      } else if ( deltaYear < 3 ) {
              chart.group(poiDayGrouping)
      } else if ( deltaYear > 3 ) {
              chart.group(poiGrouping);
      }

      //reset to current values for comparison with next iteration through zoom handler
      saveLevel = deltaYear;
      init_domain0 = chart.filters()[0][0];
      init_domain1 = chart.filters()[0][1];
    })
    .xAxis().tickFormat();

    function getBrushDates() {      
      poiDates[0] = slpDateFormat(poiChart.filters()[0][0]).toUpperCase();
      poiDates[1] = slpDateFormat(poiChart.filters()[0][1]).toUpperCase();      
    }


  //-----------------------------------
  decadeChart
    .width(380)
    .height(200)
    .margins({top: 10, right: 10, bottom: 30, left: 10})  
    .dimension(decadeDimension)
    .group(decadeGrouping)    
    .title(function (p) {      
      return p.key +": "+ p.value +" analogues";
    })    
    .colors(decadeColours)
    .elasticX(true)
    .gap(2)
    .xAxis().ticks(4);

  //-----------------------------------
  fitChart
    .width(380)
    .height(212)
    .margins({
      top: 10,
      right: 20,
      bottom: 30,
      left: 40
    })
    .dimension(fitDimension)
    .group(fitGrouping)
    .xAxisLabel("Distance")
    .yAxisLabel("Corr")
    .on("preRedraw", update0)    
    .x(d3.scale.linear().domain(disRange))
    .y(d3.scale.linear().domain(corrRange))  
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .symbolSize(8)
    .highlightedSize(8);
    // .existenceAccessor(function(d) {      
    //   return d.value > 0;
    // })
    // .colorAccessor(function(d) {
    //   return d.key[2];
    // });
    // .colors(archiveColors)
    // .filterHandler(function(dim, filters) {
    //   if (!filters || !filters.length)
    //     dim.filter(null);
    //   else {
    //     // assume it's one RangedTwoDimensionalFilter
    //     dim.filterFunction(function(d) {
    //       return filters[0].isFiltered([d[0], d[1]]);
    //     })
    //   }
    // });

    xAxis_fitChart = fitChart.xAxis();
    xAxis_fitChart.ticks(6).tickFormat(d3.format("d"));
    yAxis_fitChart = fitChart.yAxis();
    yAxis_fitChart.ticks(6).tickFormat(d3.format("d"));  


  //-----------------------------------
  dc.renderAll();  

}

//====================================================================
// Update map markers, list and number of selected
function update0() {  
  //updateList();
  d3.select("#active").text(filter.groupAll().value());
}

//====================================================================
// Update dc charts, map markers, list and number of selected
function update1() {
  dc.redrawAll();  
  //updateList();
  d3.select("#active").text(filter.groupAll().value());
}

//====================================================================
//Global vars
var filter;
var poiDimension;
var poiGrouping;
var decadeDimension;
var decadeGrouping;

var minDate, maxDate, fullRange; //full range of POI dates. Used to clear filters

var dateFormat = d3.time.format('%Y%m%d');
var slpDateFormat = d3.time.format('%d-%b-%Y');
var datepickerDateFormat = d3.time.format('%d/%m/%Y');
var poiDates = [];
var poiDates_manual = []; //filled by input date boxes
var day = 60 * 60 * 24 * 1000; //day in milliseconds

//http://www.colourlovers.com/palette/3860796/Melting_Glaciers
var decadeColours = d3.scale.ordinal()
    .range(["#67739F", "#67739F", "#67739F", "#67739F", "#B1CEF5", 
            "#B1CEF5", "#B1CEF5", "#B1CEF5"]);

var seasonColours = d3.scale.ordinal()
    .range(["#9DD8D3", "#FFE545", "#A9DB66", "#FFAD5D"]);
var seasons = { 0: "DJF", 1: "MAM", 2: "JJA", 3: "SON" };


// plot ranges
var corrRange = [], disRange = [];
var corrBinWidth = 0.1, disBinWidth = 100.;
//initial date range selected on page load, computed one year from first date upon page load
var init_date0, init_date1, dateRange = 365;

//====================================================================
function init() {

  //d3.tsv("analogues_19480101_20151225.json", function(data) {
  //d3.tsv("analogues_19480101_20160520.json", function(data) {
  d3.tsv("analogues_select.json", function(data) {
    
    minDate = dateFormat.parse(data[0].dateRef); //first date in file
    maxDate = dateFormat.parse(data[Object.keys(data).length - 1].dateRef); //last date in file

    //Set initial date range to display  
    init_date0 = dateFormat.parse(data[0].dateRef);
    //Add one year to initial date. If > maxDate, use maxDate
    if (dateFormat.parse(data[0].dateRef).addDays(365).getTime() < maxDate.getTime()) {
      init_date1 = dateFormat.parse(data[0].dateRef).addDays(365);  
    } else {
      init_date1 = maxDate;
    }

    //Sort by correlation to find correlation range
    data.sort(function(a, b) {
      return parseFloat(a.Corr) - parseFloat(b.Corr);
    });
    //Save min and max correlation (rounded down/up)
    corrRange = [Math.floor(data[0].Corr),
                     Math.ceil(data[Object.keys(data).length - 1].Corr)];

    //Sort by distance to find distance range
    data.sort(function(a, b) {
      return parseFloat(a.Dis) - parseFloat(b.Dis);
    });
    //Save min and max distance (rounded down/up)
    disRange = [Math.floor(data[0].Dis/100)*100, 
                     Math.ceil(data[Object.keys(data).length - 1].Dis/100)*100];
      
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
      else if (yr == 2016) d.dateAnlg = "2016";
      
      //bin correlation and distance
      d.Corr = d3.format(",.1f")(corrBinWidth*Math.round( d.Corr/corrBinWidth ));
      d.Dis = disBinWidth*Math.round( d.Dis/disBinWidth );

      //seasons
      month = d.dateRef.getMonth() + 1; //Jan is 0    
      if (month === 12 || month === 1 || month === 2) d.Season = 0; //DJF
      else if (month >= 3 && month <= 5) d.Season = 1; //MAM
      else if (month >= 6 && month <= 8) d.Season = 2; //JJA
      else if (month >= 9 && month <= 11) d.Season = 3; //SON
   
    });
    points=data; 
    fullRange = ( maxDate - minDate ) / ( 1000*60*60*24 ); //range in days

    initCrossfilter();

    update1();
    
  }); //end d3.tsv

  Date.prototype.addDays = function(days) {
    this.setDate(this.getDate() + parseInt(days));
    return this;
  };

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
  seasonDimension = filter.dimension(function(d) {
    return d.Season;
  });
  seasonGrouping = seasonDimension.group();

  //-----------------------------------  
  decadeDimension = filter.dimension(function(d) {
    return d.dateAnlg;
  });
  decadeGrouping = decadeDimension.group();

  //-----------------------------------  
  corrDimension = filter.dimension(function(d) {
    return d.Corr;
  });
  corrGrouping = corrDimension.group();

  //-----------------------------------  
  disDimension = filter.dimension(function(d) {
    return d.Dis;
  });
  disGrouping = disDimension.group();

  //-----------------------------------
  poiChart  = dc.barChart("#chart-poi");
  seasonsChart = dc.pieChart("#chart-seasons");
  decadeChart  = dc.rowChart("#chart-decade");
  corrChart = dc.barChart("#chart-corr");
  disChart = dc.barChart("#chart-dis");

  //-----------------------------------
  //Manual date selection
    
  //Datepicker
  //https://jqueryui.com/datepicker/#multiple-calendars
  $(function() {
    //datepickerDateFormat(init_date0)
    //$("#datepicker0").val("").prop('disabled', false); //clear after page reload
    $("#datepicker0").val(datepickerDateFormat(init_date0)).prop('disabled', false); //clear after page reload
    $("#datepicker0").datepicker({
      numberOfMonths: 3,
      showButtonPanel: true,
      dateFormat: "dd/mm/yy"
    });    
  });

  $(function() {
    $("#datepicker1").val(datepickerDateFormat(init_date1)).prop('disabled', false); //clear after page reload
    $("#datepicker1").datepicker({
      numberOfMonths: 3,
      showButtonPanel: true,
      dateFormat: "dd/mm/yy"
    });
  });

  $("#datepicker0").on('change', function() {
    var dateObj = makeDateObj($("#datepicker0"));
    console.log("dateObj: ", dateObj)
    //shift forward one day
    poiDates_manual[0] = new Date(dateObj.getTime() + day);
    useManualDates();
  });

  $("#datepicker1").on('change', function() {
    var dateObj = makeDateObj($("#datepicker1"));
    //shift forward one day
    poiDates_manual[1] = new Date(dateObj.getTime() + day);
    useManualDates();
  });

  function useManualDates() {
    d3.select("#dateReset").style("display", "block");
    d0 = makeDateObj($("#datepicker0"));
    d1 = makeDateObj($("#datepicker1"));

    console.log("d0: ", d0)
    console.log("d1: ", d1)
             
    poiDimension.filterAll();
    resetChart(poiChart);
    poiDimension.filter([d0, d1]);
    poiChart.filter(dc.filters.RangedFilter(d0, d1));
    dc.redrawAll();
  }

  function makeDateObj(dateRaw) {
    var dateString = dateRaw.val().split("/");    
    var dateObj = new Date(dateString[2], dateString[1] - 1, dateString[0]);

    return dateObj;

  }

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
    .filter(dc.filters.RangedFilter(init_date0, init_date1))
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
      if (poiChart.filters().length > 0) {
        //Put poiChart brush dates in manual datepicker text boxes
        $("#datepicker0").val(datepickerDateFormat(poiChart.filters()[0][0]));
        $("#datepicker1").val(datepickerDateFormat(poiChart.filters()[0][1]));

        poiDates[0] = slpDateFormat(poiChart.filters()[0][0]).toUpperCase();
        poiDates[1] = slpDateFormat(poiChart.filters()[0][1]).toUpperCase();
      }
    }

  //-----------------------------------
  seasonsChart
    .width(5)
    .height(85)
    .radius(30)
    .slicesCap(4)
    .innerRadius(5)
    .colors(seasonColours) //DJF, JJA, MAM, SON  
    .dimension(seasonDimension)
    .group(seasonGrouping)    
    .label(function(d) {
      return seasons[d.key];
    })
    .title(function(d) {
      return seasons[d.key] +": "+ d.value +" analogues";
    });
   
  //-----------------------------------
  decadeChart
    .width(380)
    .height(200)
    //.margins({top: 10, right: 10, bottom: 30, left: 10})
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
  corrChart
    .width(380)
    .height(200)
    .margins({top: 10, right: 20, bottom: 30, left: 40})
    .centerBar(true)
    .elasticY(true)
    .dimension(corrDimension)
    .group(corrGrouping)
    //.on("preRedraw",update0)
    .x(d3.scale.linear().domain(corrRange))    
    .xUnits(dc.units.fp.precision(corrBinWidth))
    //.round(function(d) {return corrBinWidth*Math.floor(d/corrBinWidth)})
    .gap(0)
    .renderHorizontalGridLines(true)
    .xAxisLabel("Correlation")
    .yAxisLabel("Count");

  xAxis_corrChart = corrChart.xAxis();
  xAxis_corrChart.ticks(6).tickFormat(d3.format(".1f"));
  yAxis_corrChart = corrChart.yAxis();
  yAxis_corrChart.tickFormat(d3.format(",.2s")).tickSubdivide(0);

  //-----------------------------------   
  disChart
    .width(380)
    .height(200)
    .margins({top: 10, right: 20, bottom: 30, left: 40})
    .centerBar(true)
    .elasticY(true)
    .dimension(disDimension)
    .group(disGrouping)
    //.on("preRedraw",update0)
    .x(d3.scale.linear().domain(disRange))
    .xUnits(dc.units.fp.precision(disBinWidth))
    //.round(function(d) {return disBinWidth*Math.floor(d/disBinWidth)})
    .gap(0)
    .renderHorizontalGridLines(true)
    .xAxisLabel("Distance")
    .yAxisLabel("Count");

  xAxis_disChart = disChart.xAxis();
  xAxis_disChart.ticks(6).tickFormat(d3.format("d"));
  yAxis_disChart = disChart.yAxis();
  yAxis_disChart.tickFormat(d3.format(",.2s")).tickSubdivide(0);

  //-----------------------------------
  dataCount = dc.dataCount('#chart-count');

  dataCount 
    .dimension(filter)
    .group(filter.groupAll())
    .html({
    some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
          ' | <a href=\'javascript: resetAll();\'>Reset All</a>',
          all: 'All records selected. Please click on the graph to apply filters.'
    });

  //-----------------------------------
  dc.renderAll();

  //http://stackoverflow.com/questions/21114336/how-to-add-axis-labels-for-row-chart-using-dc-js-or-d3-js
  function AddXAxis(chartToUpdate, displayText) {
    chartToUpdate.svg()
      .append("text")
      .attr("class", "x-axis-label")
      .attr("text-anchor", "middle")
      .attr("x", chartToUpdate.width() / 2)
      .attr("y", chartToUpdate.height() + 0)
      .text(displayText);
  }
  AddXAxis(decadeChart, "Count");

  function onresize() {
    
    dc.chartRegistry.list().forEach(function(chart) {
      _bbox = chart.root().node().parentNode.getBoundingClientRect();
 
      //__dcFlag__ = 1 is poiChart. Scale it differently.
      rescaleFactor = (chart.__dcFlag__ === 1) ? .66 : .30;
                    
      chart.width(_bbox.width * rescaleFactor);

      dc.renderAll();
    });
  };
            
  onresize();
  
  window.addEventListener('resize', onresize);

} //end initCrossfilter()

//====================================================================
// Update dc charts, map markers, list and number of selected
function update1() {
  dc.redrawAll();
}

//====================================================================
// Reset all
function resetAll() {
  $("#datepicker0").val("").prop("disabled", false);
  $("#datepicker1").val("").prop("disabled", false);

  poiChart.filterAll(); 
  seasonsChart.filterAll();
  decadeChart.filterAll();
  corrChart.filterAll();
  disChart.filterAll();
  dc.redrawAll();
}

//====================================================================
function resetChart(thisChart) {

    if (thisChart.__dcFlag__ === 1 ) {//POI barChart
      thisChart.focus()
      thisChart.filterAll();

      //Re-activate datepicker text inputs
      $("#datepicker0").prop('disabled', false);
      $("#datepicker1").prop('disabled', false);
      d3.select("#dateReset").style("display", "none");

    } else { //seasons pieChart
      //clear all three barCharts that get activated by pieChart reset
      poiChart.filterAll();
      corrChart.filterAll();
      disChart.filterAll();
    }
    
}
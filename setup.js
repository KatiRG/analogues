
//====================================================================
//Global vars
var filter;
var poiDimension;
var poiGrouping;
var decadeDimension;
var decadeGrouping;
var avgStddevGroup;

var minDate, maxDate, fullRange; //full range of POI dates. Used to clear filters
var dataHour = "1200" //hour to set each dateRef to (default 00:00:00 GMT+0100)


var dateFormat = d3.time.format('%Y%m%d%H%M');
var datepickerDateFormat = d3.time.format('%d/%m/%Y'); //for display in calendar text boxes
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
var init_date0, init_date1;

//====================================================================
function init() {
  //read config file
  //d3.text("config_test.txt", function(text) {
  //config_ana_slp_surface__rms_NA_sim_1948-01-01_2016-09-19_base_1948-01-01_2016-09-19_-80.0_50.0_22.5_70.0_1_30_20.txt
  //d3.text("config_test_11anlgs.txt", function(text) {
  d3.text("config_ana_slp_surface_base_rms_NA_sim_1948-01-01_2016-09-23_base_1948-01-01_2016-09-23_-80.0_50.0_22.5_70.0_1_30_20.txt", function(text) {    
    text_array = d3.csv.parseRows(text);

    //Find element containing param string
    for (idx = 0; idx < text_array.length; idx++) {
      t = text_array[idx].toString();
          
      if (t.indexOf('outputfile') != -1) idx_outputfile = idx;
      if (t.indexOf('nanalog') != -1) idx_nanalog = idx;
      if (t.indexOf('varname') != -1) idx_varname = idx;
      if (t.indexOf('simsource') != -1) idx_simsource = idx;
      if (t.indexOf('archisource') != -1) idx_archivesource = idx;
      if (t.indexOf('predictordom') != -1) idx_bbox = idx;
      if (t.indexOf('archiperiod') != -1) idx_refperiod = idx;
    }

    //Parameters to display in html (find by string match)
    outputfile = text_array[idx_outputfile].toString().split("=").pop();
    nanalog = text_array[idx_nanalog].toString().split("=").pop();
    varname = text_array[idx_varname].toString().split("=").pop();
    simsource = text_array[idx_simsource].toString().split("=").pop();
    archivesource = text_array[idx_archivesource].toString().split("=").pop();
    bbox = text_array[idx_bbox].toString().split("=").pop();
        
    startref = text_array[idx_refperiod][0].split('= "')[1];
    if (startref != "dummy")
      startref = startref.slice(8,10) + "/" + startref.slice(5,7) + "/" + startref.slice(0,4);
  
    endref = text_array[idx_refperiod][1];
    if (endref.indexOf("dummy") === -1)
      endref = endref.slice(8,10) + "/" + endref.slice(5,7) + "/" + endref.slice(0,4);
    else endref = "dummy";
        
    $(".content .value-outputfile").html(outputfile);
    $(".content .value-nanalog").html(nanalog);
    $(".content .value-varname").html(varname);
    $(".content .value-simsource").html(simsource);
    $(".content .value-archivesource").html(archivesource);
    $(".content .value-bbox").html(bbox);
    $(".value-ref").html(startref + " &ndash; " + endref);
    
  });

  //http://localhost:8090/wpsoutputs/flyingpigeon/analogs-12f189be-79a7-11e6-b7f7-e7ff4fd8b248.txt
  //config_ana_slp_surface__rms_NA_sim_1948-01-01_2016-09-19_base_1948-01-01_2016-09-19_-80.0_50.0_22.5_70.0_1_30_20.txt
  //d3.tsv("test_11anlgs.json", function(data) {
  //d3.tsv("ana_slp_surface_base_rms_NA_sim_1948-01-01_2016-09-23_base_1948-01-01_2016-09-23_-80.0_50.0_22.5_70.0_1_30_20.json", function(data) {  

  //http://birdhouse-lsce.extra.cea.fr:8090/wpsoutputs/flyingpigeon/analogs-73cd782c-74f4-11e6-bf5f-f73f2a3d7e35.txt
  //d3.tsv("test_gt1yr_birdhouse.json", function(data) {
  //d3.tsv("test_gt1yr_birdhouse_03Jan2013.json", function(data) {

  //d3.tsv("test2_edit.json", function(data) {
  //d3.tsv("test_gt1yr.json", function(data) {
  //d3.tsv("test_span2months.json", function(data) {
  //d3.tsv("test_span2months_edit.json", function(data) {
  d3.tsv("modified-analogfileyODtII.tsv", function(data) { //multiple decades

    var firstDate = data[0].dateRef + dataHour; //set time from midnight to noon
    var lastDate = data[Object.keys(data).length - 1].dateRef + dataHour;
    minDate = dateFormat.parse(firstDate);
    maxDate = dateFormat.parse(data[Object.keys(data).length - 1].dateRef + dataHour);

    $(".value-sdate").html(datepickerDateFormat(minDate));
    $(".value-edate").html(datepickerDateFormat(maxDate));

    //Set initial date range to display
    init_date0 = dateFormat.parse(data[0].dateRef + dataHour);
    //Add one year to initial date. If > maxDate, use maxDate
    if (dateFormat.parse(data[0].dateRef + dataHour).addDays(364).getTime() < maxDate.getTime()) {
      init_date1 = dateFormat.parse(data[0].dateRef + dataHour).addDays(364);
      init_date1.setHours(14); //to catch last day of month at 12:00
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
      
    data.forEach(function(d, idx) {

      //set time from midnight to noon
      d.dateRef = dateFormat.parse(d.dateRef + dataHour); //resolution = day
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
      d.Corr = (corrBinWidth * Math.round(d.Corr / corrBinWidth)).toFixed(1)/1;
      d.Dis = disBinWidth * Math.round(d.Dis / disBinWidth).toFixed(1)/1;
               
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

} //end fn init()

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

  //Errorbars for rowChart
  //http://jsfiddle.net/gordonwoodhull/yrugrbhq/17/
  //http://labs.physics.dur.ac.uk/skills/skills/poisson.php
  avgStddevGroup = decadeDimension.group().reduce(
      function(p, v) {
        ++p.count;
        
        if(p.count>1)
          p.var = p.count; //(p.count - 2) * p.var / (p.count - 1) + da*da/p.count;
        p.stddev = Math.sqrt(p.var);
        return p;
      }, function(p, v) {
        // exercise for the reader
        --p.count;
        
        if(p.count>1)
          p.var = p.count; //(p.count - 2) * p.var / (p.count - 1) + da*da/p.count;
        p.stddev = Math.sqrt(p.var);
      
      }, function() {
          return {count: 0, var: 0}
      });
  var endwid = 5;

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
  errorChart  = dc.rowChart("#chart-error");
  corrChart = dc.barChart("#chart-corr");
  disChart = dc.barChart("#chart-dis");

  //-----------------------------------
  //Manual date selection
  var calendarFlag = 0; //1 = dates come from datePicker calendar
  var calendarDate0, calendarDate1; //global, for datePicker text box
  var zoomFlag = 0; //1 = dates come from poiChart zoom

  //Datepicker
  //https://jqueryui.com/datepicker/#multiple-calendars
  $(function() {
    $("#datepicker0").val(datepickerDateFormat(init_date0)).prop('disabled', false); //clear after page reload
    $("#datepicker0").datepicker({
      numberOfMonths: 3,
      showButtonPanel: true,
      dateFormat: "dd/mm/yy",
      minDate: minDate,
      maxDate: maxDate
    });
  });

  $(function() {
    $("#datepicker1").val(datepickerDateFormat(init_date1)).prop('disabled', false); //clear after page reload
    $("#datepicker1").datepicker({
      numberOfMonths: 3,
      showButtonPanel: true,
      dateFormat: "dd/mm/yy",
      minDate: minDate,
      maxDate: maxDate
    });
  });

  //Activate calendar popup in case closed by invalid date selection
  $("#datepicker0").on('click', function() {
    d3.select("#ui-datepicker-div").style("display", "block");
  });

  $("#datepicker1").on('click', function() {
    d3.select("#ui-datepicker-div").style("display", "block");
  });

  //Pass start and end date selections to poiChart
  $("#datepicker0").on('change', function() {
    //Do not trigger poiChart if dates come from sliding brush
    useManualDates();    
  });

  $("#datepicker1").on('change', function() {
    useManualDates();
  });

  function useManualDates() {
    d3.select("#dateReset").style("display", "block");

    var d0 = makeDateObj($("#datepicker0")),
        d1 = makeDateObj($("#datepicker1"));

    var diffDate = ( d1 - d0 ) / ( 1000*60*60*24 ); //diff in days
    if (diffDate < 0) {
      alert("End Date is earlier than Start Date");
      $("#datepicker0").val(datepickerDateFormat(minDate));
      $("#datepicker1").val(datepickerDateFormat(maxDate));

      //close calendar
      d3.select("#ui-datepicker-div").style("display", "none");

      //pass min and max dates to poiChart
      d0 = minDate;
      d1 = maxDate;
     
    }

    //Offset by 2h on either side of brush
    // d0.setHours(10);
    // d1.setHours(14);

    //global vars read by getBrushDates()
    calendarFlag = 1;
    calendarDate0 = d0;
    calendarDate1 = d1;

    //poiChart.filterAll();
    poiChart.filter(null);
    poiChart.filter(dc.filters.RangedFilter(d0, d1));
    dc.redrawAll();

    // poiDimension.filterAll();
    // resetChart(poiChart);
    // poiDimension.filter([d0, d1]);
    // poiChart.filter(dc.filters.RangedFilter(d0, d1));
    // dc.redrawAll();

  }

  function makeDateObj(dateRaw) {
    var dateString = dateRaw.val().split("/");
    var dateStringFormat = dateString[2] + dateString[1] + dateString[0] + dataHour;
    dateObj = dateFormat.parse(dateStringFormat);

    return dateObj;
  }

  //-----------------------------------
  //https://github.com/dc-js/dc.js/wiki/Zoom-Behaviors-Combined-with-Brush-and-Range-Chart
  var currentGranularity = 'month';
  var saveLevel = 0;
  var dateFormatForZoom = d3.time.format('%Y%m%d');
  var init_domain0 = dateFormatForZoom.parse("21000101"), 
      init_domain1 = dateFormatForZoom.parse("2100101");
  var resolnLimit = 260; //365; //Determines cutoff for month or day resoln (in days)

  $(".content .value-resolnLimit").html("For periods &ge; " + resolnLimit + 
    " days, bars show monthly sum of analogues. Otherwise, the bars show the daily analogue count.");

  //Determine date resolution of poiChart
  //http://stackoverflow.com/questions/23953019/dc-js-group-top5-not-working-in-chart
  function getDateGrouping() {
    return fullRange < resolnLimit ? poiDayGrouping : poiGrouping;
  }
  var dateGroup = getDateGrouping();

  //Set time for brush (10:00 to capture first date in brush window, 
  //14:00 to capture last date in window)
  //CANNOT do this in RangedFilter
  minDate.setHours(10);
  init_date1.setHours(14);
  poiChart
    .width(780)
    .height(200)
    .margins({
      top: 10,
      right: 20,
      bottom: 30,
      left: 40
    })
    .mouseZoomable(true)  
    .dimension(poiDimension)                
    .group(dateGroup)                
    .transitionDuration(500)
    .filter(dc.filters.RangedFilter(minDate, init_date1))
    .gap(10)
    .centerBar(false)
    //set filter brush rounding
    //.round(d3.time.day.round)
    .round(d3.time.month.round)
    .x(d3.time.scale()
      .domain(d3.extent(points, function(d) {
        return d.dateRef; 
      }))
      //.rangeRound([0, 1 * 24])
    )
    //.xUnits(d3.time.months)
    //.xUnits(function(){return 500;})
    .elasticY(true)
    .elasticX(false)
    .renderHorizontalGridLines(true)
    .on("filtered", getBrushDates)
    .on('zoomed', function(chart, filter) {

      zoomFlag = 1;

      //If > resolnLimit, show dates in month resolution
      var deltaYear = ( chart.filter()[1] - chart.filter()[0] ) / ( 1000*60*60*24 ); //diff in days
      
      //if analysis period < 1 year, set poiChart in day grouping mode
      if (deltaYear === 0) {
        chart.group(poiDayGrouping).round(d3.time.day.round);
      }

      //handle weird case where zoom is stuck at same deltaYear and cannot zoom out further
      //while user keeps zooming out
      else if (saveLevel - deltaYear === 0) {
        //only reset to default domain when no change in domain is happening at either ends
        if (init_domain0.getTime() === chart.filter()[0].getTime() &&
            init_domain1.getTime() === chart.filter()[1].getTime()) {
          chart.x().domain(chart.xOriginalDomain());         
          chart.group(poiGrouping).round(d3.time.month.round);
         
          // dc.refocusAll()
          // chart.filterAll();
          chart.render();
        }
      } else if (deltaYear <= resolnLimit) {
        //chart.xUnits(d3.time.days);
        chart.group(poiDayGrouping).round(d3.time.day.round);
        // console.log("set width")
        // chart.xUnits(d3.time.days);
        
      } else if (deltaYear > resolnLimit) {
        //console.log("set to d3.time.months")
        //chart.xUnits(d3.time.months)
        chart.group(poiGrouping).round(d3.time.month.round);
      }

      //reset to current values for comparison with next iteration through zoom handler
      // chart.filter()[1].setHours(12);
      // chart.filter()[1].setMinutes(0);
      // chart.filter()[1].setSeconds(0);
      saveLevel = deltaYear;
      init_domain0 = chart.filter()[0];
      init_domain1 = chart.filter()[1];
      // init_domain0.setHours(10);
      // init_domain1.setHours(14);
      // console.log("init_domain0: ", init_domain0)
      // console.log("init_domain1: ", init_domain1)

    })
    .xAxis().tickFormat();

    function getBrushDates() {
      if (poiChart.filters().length > 0) {
        
        if (calendarFlag === 1) { //dates come from calendar
    
          changeTextboxDates(calendarDate0, calendarDate1);
          calendarFlag = 0; //reset

          var dateDiff = ( poiChart.filter()[1] - poiChart.filter()[0] ) / ( 1000*60*60*24 ); //diff in days
          if (dateDiff > resolnLimit) {
            poiChart.group(poiGrouping).round(d3.time.month.round);
          } else {
            poiChart.group(poiDayGrouping).round(d3.time.day.round);
          }

          //Make sure x-axis contains selected dates
          poiChart.x().domain([calendarDate0, calendarDate1]);
          poiChart.render();

        } else {//dates to come from mouse zoom or sliding brush
                
          //Find date(s) in brush window
          //Adjust based on if > or < 12:00
          if (poiChart.filter()[0].getHours() > 12 && poiChart.filter()[0].getSeconds() > 0){
            start_day = shiftDay("addDay");
          } else if (poiChart.filter()[0].getHours() === 12){
            start_day = poiChart.filter()[0];
          }
          else if (poiChart.filter()[0].getHours() < 12) {
            start_day = poiChart.filter()[0];
          }          
          console.log("start_day: ", start_day) 
 
          if (poiChart.filter()[1].getHours() < 12) {
            end_day = shiftDay("subtractDay");
          } else if (poiChart.filter()[1].getHours() >= 12) {
            end_day = poiChart.filter()[1];
          }
          console.log("end_day: ", end_day) 

          //Update date display in calendar text boxes
          changeTextboxDates(start_day, end_day);

        } //end flag check for picking dates
        
  
      } //end check of poiChart filters length


    } //end fn getBrushDates

    function changeTextboxDates(d0, d1) {
      //Put poiChart brush dates in manual datepicker text boxes
      $("#datepicker0").val(datepickerDateFormat(d0));
      $("#datepicker1").val(datepickerDateFormat(d1));
    }

    function shiftDay(whichSign) {
      if (whichSign === "addDay") {
        return new Date ( poiChart.filter()[0].getFullYear(),
                          poiChart.filter()[0].getMonth(),
                          (poiChart.filter()[0].getDate()+1) )
      } else if (whichSign === "subtractDay") {       
        return new Date ( poiChart.filter()[1].getFullYear(),
                          poiChart.filter()[1].getMonth(),
                          (poiChart.filter()[1].getDate()-1) )
      }
    }

  //-----------------------------------
  seasonsChart
    .width(5)
    .height(100)
    .radius(45)
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
    // .valueAccessor(function(d) {
    //   console.log("d: ", d)
    //     //if (d.value != 0) return 0.25;
    //     return 0.25;
    // });
  
  //Show season string instead of number in reset display
  seasonsChart.filterPrinter(function(filters) { 
    return filters.map(function(key) { return seasons[key]; }).join(', '); 
  })

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

  errorChart
    .width(380)
    .height(200)
    //.margins({top: 10, right: 10, bottom: 30, left: 10})
    .dimension(decadeDimension)
    .group(avgStddevGroup)
    .valueAccessor(function(kv) {
      console.log(kv)
      return kv.value.count;
    })
    .title(function (p) {
      return p.key +": "+ p.value.count +" analogues";
    })
    .on('renderlet', function(chart) {
      var barHeight = chart.select('g.row rect').attr('height');
      console.log(barHeight);
      var ebar = chart.selectAll('g.row')
       .append('g')
        .attr('class', 'errorbar');
      ebar
        .append('line')
        .attr({
          'stroke-width': 1,
          stroke: '#B79FA3',
          x1: function(d) {
            console.log("d: ", d)
            return chart.x()(d.value.count - d.value.stddev);
          },
          y1: function(d) {
            console.log("barHeight in here: ", barHeight)
            return barHeight/2;
          },
          x2: function(d) {
            return chart.x()(d.value.count + d.value.stddev);
          },
          y2: function(d) {
            return  barHeight/2;
          }
        });
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
  $("#datepicker0").val(datepickerDateFormat(minDate));
  $("#datepicker1").val(datepickerDateFormat(maxDate));

  //poiChart.filterAll();
  
  //poiDimension.filterAll();
  resetChart(poiChart);

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

//====================================================================
Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + parseInt(days));
  return this;
};
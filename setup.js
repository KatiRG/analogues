
//====================================================================

var filter;
var poiDimension;
var poiGrouping;
var decadeDimension;
var decadeGrouping;


var dateFormat = d3.time.format('%Y%m%d');

//http://www.colourlovers.com/palette/3860796/Melting_Glaciers
var decadeColours = d3.scale.ordinal()
    .range(["#67739F", "#67739F", "#67739F", "#67739F", "#B1CEF5", 
            "#B1CEF5", "#B1CEF5", "#B1CEF5"]);

//====================================================================
function init() {

//d3.tsv("analogues_reformat.json", function(data) {
d3.tsv("analogues_select.json", function(data) {  
    
  data.forEach(function (d, idx) {      

    yr = parseInt(d.dateAnlg.substring(0, 4));

    if (yr >= 1948 && yr <= 1955) d.dateAnlg = "1948-1955";
    else if (yr >= 1956 && yr <= 1965) d.dateAnlg = "1956-1965";
    else if (yr >= 1966 && yr <= 1975) d.dateAnlg = "1966-1975";
    else if (yr >= 1976 && yr <= 1985) d.dateAnlg = "1976-1985";
    else if (yr >= 1986 && yr <= 1995) d.dateAnlg = "1986-1995";
    else if (yr >= 1996 && yr <= 2005) d.dateAnlg = "1996-2005";
    else if (yr >= 2006 && yr <= 2015) d.dateAnlg = "2006-2015";
    
    d.dateRef = dateFormat.parse(d.dateRef);  //resolution = day
    
  });  
  points=data;

  initCrossfilter();


  // Render the total.
  d3.selectAll("#total")
    .text(filter.size());

  //initList();

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
  // decadeGrouping = decadeDimension.group().reduce(

  //   //Fns to scale count in decade 1946-1955.
  //   function (p, v) {
  //     ++p.count;

  //     console.log("p: ", p)
  //     console.log("v: ", v)

  //     return p;
  //   },

  //   function (p, v) {
  //     --p.count;

  //     return p;
  //   },

  //   function () {
  //     return {
  //       count: 0
  //       //scaledCount: 0
  //     };
  //   }
  // );

  //-----------------------------------
  poiChart  = dc.barChart("#chart-poi");  
  decadeChart  = dc.rowChart("#chart-decade");  

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
    //.filter(dc.filters.RangedFilter(dateFormat.parse("20130101"), dateFormat.parse("20131231")))
    .gap(10)    
    .x(d3.time.scale().domain(d3.extent(points, function(d) {
      return d.dateRef; 
    })))    
    .elasticY(true) 
    .elasticX(false)
    .renderHorizontalGridLines(true)
    .on('zoomed', function(chart, filter) {

      deltaYear = chart.filters()[0][1].getFullYear() - chart.filters()[0][0].getFullYear();

      //handle weird case where zoom is stuck at same deltaYear 
      //and keeps zooming out but focus is stuck at this level      
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

//====================================================================
function initList() {
  var proxyItem = d3.select("#proxiesListTitle")
  		.append("div")
  		.attr("class", "row");
  proxyItem.append("div")
   	.attr("class", "col-md-1")
   	.style("width", "50px")
   	.text("Id");
  proxyItem.append("div")
   	.attr("class", "col-md-1")
   	.style("width", "80px")
   	.style("text-align", "right")
   	.text("Depth");
  proxyItem.append("div")
   	.attr("class", "col-md-1")
   	.style("text-align", "right")
   	.text("Most recent");
  proxyItem.append("div")
   	.attr("class", "col-md-1")
   	.style("text-align", "right")
   	.text("Oldest");
  proxyItem.append("div")
   	.attr("class", "col-md-1")
   	.style("text-align", "left")
   	.text("Archive");
  proxyItem.append("div")
   	.attr("class", "col-md-2")
   	.style("text-align", "left")
   	.text("Material");
  proxyItem.append("div")
        .attr("class", "col-md-2")
   	.style("text-align", "left")
   	.text("DOI");
  proxyItem.append("div")
        .attr("class", "col-md-3")
   	.style("width", "350px")
   	.style("text-align", "left")
   	.text("Reference");

  format1 = d3.format(".0f");
  format2 = d3.format(".2f");

  var pointIds = idGrouping.all();
  for (var i = 0; i < pointIds.length; i++) {
  	var proxyItem = d3.select("#proxiesList")
    			.append("div")
    			.attr("class", "proxyItem row")
         		.attr("id", (i+1).toString());
  	proxyItem.append("div")
         	.attr("class", "col-md-1")
   		.style("width", "50px")
         	.attr("title", "#"+ points[i].Id)
         	.text("#"+points[i].Id)
		.on("mouseover", function() { d3.select(this).style("font-weight", "bold"); })
		.on("mouseout", function() { d3.select(this).style("font-weight", "normal"); })
		.on('click', popupfromlist);
  	proxyItem.append("div")
         	.attr("class", "col-md-1")
   		.style("width", "80px")
         	.style("text-align", "right")
		.style("color", "#2EA3DB")
         	.attr("title", points[i].Depth)
         	.text(format1(points[i].Depth));
  	proxyItem.append("div")
         	.attr("class", "col-md-1")
         	.style("text-align", "right")
		.style("color", "#F5B441")
                .attr("title", points[i].RecentDate)
                .text(format2(points[i].RecentDate));
        proxyItem.append("div")
                .attr("class", "col-md-1")
                .style("text-align", "right")
                .style("color", "#F5B441")
         	.attr("title", points[i].OldestDate)
         	.text(format2(points[i].OldestDate));
  	proxyItem.append("div")
         	.attr("class", "col-md-1")
         	.style("text-align", "left")
         	.attr("title", points[i].Archive)
         	.text(points[i].Archive);
  	proxyItem.append("div")
         	.attr("class", "col-md-2")
         	.style("text-align", "left")
         	.attr("title", points[i].Material)
         	.text(points[i].Material);
  	proxyItem.append("div")
         	.attr("class", "col-md-2")
         	.style("text-align", "left")
         	.attr("title", points[i].DOI)
         	.text(points[i].DOI)
		.on("mouseover", function() { d3.select(this).style("color", "#0645AD"); })
		.on("mouseout", function() { d3.select(this).style("color", "#333"); })
		.on("click", function(d,i) { window.open("https://scholar.google.fr/scholar?q=" + points[i].DOI); });
  	proxyItem.append("div")
         	.attr("class", "col-md-3")
   		.style("width", "350px")
         	.style("text-align", "left")
         	.attr("title", points[i].Reference)
         	.text(points[i].Reference);
  }
}

//====================================================================
function popupfromlist() {
	var id = d3.select(this).text().split('#').pop();
	var i = id -1;
	var lng = points[i].Longitude;
	var lat = points[i].Latitude;
	//map.setView(new L.LatLng(lat,lng), 6);
	//map.panTo(new L.LatLng(lat,lng));
	//markers[i].openPopup();
	// https://github.com/Leaflet/Leaflet.markercluster/issues/46
	var m = markers[i];
	markerGroup.zoomToShowLayer(m, function () {
				map.setView(new L.LatLng(lat,lng), 6);  // added to handle single marker
				m.openPopup();
			});
	var container = $("#proxiesList");
	var scrollTo = $("#" + id);
	container.scrollTop( scrollTo.offset().top - container.offset().top + container.scrollTop() );
        $(".proxyItem").css("font-weight", "normal");
	$("#"+this.id).css("font-weight", "bold");
}

//====================================================================
function updateList() {
  var pointIds = idGrouping.all();
  for (var i = 0; i < pointIds.length; i++) {
    if (pointIds[i].value > 0)
	 $("#"+(i+1)).show();
    else
	 $("#"+(i+1)).hide();
  }
}
//====================================================================
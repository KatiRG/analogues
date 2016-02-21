
//====================================================================

var filter;
var poiDimension;
var poiGrouping;
var archiveDimension;
var archiveGrouping;

//http://www.colourlovers.com/palette/3860796/Melting_Glaciers
var decadeColors = d3.scale.ordinal()
    .range(["#67739F", "#67739F", "#67739F", "#B1CEF5", "#B1CEF5", "#B1CEF5", "#B1CEF5"]);

// var idDimension;
// var idGrouping;

//====================================================================
function init() {

//d3.tsv("analogues_control.tsv", function(data) {
//d3.tsv("analogues_reformat.tsv", function(data) {
d3.tsv("analogues_reformat_cut.tsv", function(data) {  
//d3.tsv("analogues_select.tsv", function(data) {
  var dateFormat = d3.time.format('%Y%m%d');

  data.forEach(function(d) {    
    d.dateRef = dateFormat.parse(d.dateRef);
    d.dateAnlg = dateFormat.parse(d.dateAnlg);
    // d.Cor = +d.Cor;
    // d.Dis = +d.Dis;
    //console.log("d.dateAnlg: ", d.dateAnlg.getFullYear())
  });
  points=data;




  //initMap();
  initCrossfilter();


// dimension and group for looking up currently selected markers
  // idDimension = filter.dimension(function(d, i) { return i; });
  // idGrouping = idDimension.group(function(id) { return id; });

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
  archiveDimension = filter.dimension( function(d) { 
    return d.dateAnlg; });
  archiveGrouping = archiveDimension.group();

  //-----------------------------------
  poiDimension = filter.dimension( function(d) {
    return d3.time.day(d.dateRef);
  });
  poiGrouping = poiDimension.group()
    .reduceCount(function(d) { return d.dateRef; });

  //-----------------------------------  
  decadeDimension = filter.dimension(function(d) {    
    year = d.dateAnlg.getFullYear();    

         if (year >= 1940 && year <= 1949) return "1940-1949";
    else if (year >= 1950 && year <= 1959) return "1950-1959";
    else if (year >= 1960 && year <= 1969) return "1960-1969";
    else if (year >= 1970 && year <= 1979) return "1970-1979";
    else if (year >= 1980 && year <= 1989) return "1980-1989";
    else if (year >= 1990 && year <= 1999) return "1990-1999";
    else if (year >= 2000 && year <= 2009) return "2000-2009";
    else if (year >= 2010 && year <= 2019) return "2010-2019";
    //else return null;
  });
  decadeGrouping = decadeDimension.group();

  //-----------------------------------
  poiChart  = dc.barChart("#chart-poi");  
  //archiveChart  = dc.rowChart("#chart-archive");  
  decadeChart  = dc.rowChart("#chart-decade");  

  //-----------------------------------
  //https://github.com/dc-js/dc.js/wiki/Zoom-Behaviors-Combined-with-Brush-and-Range-Chart
  dateFormat = d3.time.format('%Y%m%d');
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
    //.filter([19800101, 20150101])
    //.filter(dc.filters.RangedFilter(new Date(19800101), new Date(20150101)))
    .filter(dc.filters.RangedFilter(dateFormat.parse("20130101"), dateFormat.parse("20131231")))
    .gap(10)
    .x(d3.time.scale().domain(d3.extent(points, function(d) { return d.dateRef; })))    
    .elasticY(true) 
    .elasticX(false)       
    .renderHorizontalGridLines(true)
    .xAxis().tickFormat();   

  //-----------------------------------
  


  //-----------------------------------
  // archiveChart
  //   .width(180)
  //   .height(800)
  //   .margins({top: 10, right: 10, bottom: 30, left: 10})	
  //   .dimension(archiveDimension)
  //   .group(archiveGrouping)
  //   .renderLabel(false)
  //   //.label(function (p) { return p.key.getFullYear(); })
  //   //.colors(archiveColors)
  //   .elasticX(true)
  //   .gap(2)
  //   .xAxis().ticks(4);

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
    //.colors(decadeColours)
    .colors(decadeColors)
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

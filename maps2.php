<!DOCTYPE html>
<html>
<!--
 ##########################################################################
 Patrick.Brockmann@lsce.ipsl.fr
 Cathy.Nangini@lsce.ipsl.fr
 PLEASE DO NOT COPY OR DISTRIBUTE WITHOUT PERMISSION
 ##########################################################################
-->

<head>
  <meta charset="utf-8">
  <title>Analogues Viewer</title>

  <script src="lib/jquery-1.12.0.min.js"></script>

  <!--slider bar related-->
  <link type="text/css" href="lib/jq/jquery-ui-1.8.21.custom.css" rel="Stylesheet" />
  <script type="text/javascript" src="lib/jq/jquery-1.9.1.js"></script>
  <script type="text/javascript" src="lib/jq/jquery-ui-1.10.2.custom.min.js"></script>
  <link rel="stylesheet" href="lib/jq/classic.css" type="text/css" />
  <script src="lib/jq/jQDateRangeSlider-min.js"></script>


  <script src="lib/d3-3.5.15.min.js"></script>
  <script src="lib/crossfilter-1.3.12.min.js"></script>


  <script src="lib/dc.min.js"></script>
  <!--<script src="lib/dc.beta26.js"></script>-->
  <link rel="stylesheet" href="lib/dc.min.css" />

  <script src="setup.js"></script>

  <script src="lib/bootstrap.min.js"></script>
  <link href="lib/bootstrap.min.css" rel="stylesheet">

  <link href="sticky-footer-navbar.css" rel="stylesheet">

  <link href="style.css" rel="stylesheet" type="text/css" media="all">

  <script src="lib/pace.min.js"></script>
  <link href="lib/pace-theme-loading-bar.css" rel="stylesheet" />

</head>

<body onload='init();'>

  <div id="wrap">

    <!-- Fixed navbar -->
    <div class="navbar navbar-default navbar-fixed-top" role="navigation">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
              <span class="sr-only">Toggle navigation</span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </button>
          <a class="navbar-brand" href="index.html">Analogues Viewer</a>
        </div>
        <div class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li><a href="help.html">Help</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <!--/.nav-collapse -->
      </div>
    </div>

    <!-- Begin page content -->
    <div class="container">
      <div class="row">
        <div class="dc-chart col-md-6" id="chart-poi">
          <div class="dc-chart-title">Period of Interest</div>
          <a class="reset" href="javascript:dc.refocusAll();poiChart.filterAll();dc.redrawAll();" style="display: none;">reset</a>
          <span class="reset" style="display: none;"><span class="filter"></span></span>
          <br>
        </div>

      </div>
      <div class="row">
        <div class="dc-chart col-md-2" id="chart-decade">
          <div class="dc-chart-title">Archive decade</div>
          <a class="reset" href="javascript:decadeChart.filterAll();dc.redrawAll();" style="display: none;">reset</a>
          <br>
        </div>
      </div>

      <div class="row">
        <div id="totals"><span id="active">-</span> of <span id="total">-</span> analogues selected<br><br></div>
      </div>
      <div class="row">
        <div id="proxiesListTitle" class="col-md-12"></div>
        <div id="proxiesList" class="col-md-12" style="max-height: 160px; overflow-y:auto;"></div>
      </div>

      <!--MAP STUFF -->

      <table border="1">

        <tr>
          <td style="vertical-align:top; padding:15px; width: 1000px;">
            <p>Date:</p>
            <div id="slider"></div>
          </td>
        </tr>

        <!--COMMAND-->
        <tr>
          <td style="vertical-align:top; padding:15px;">
            <p>Command:</p>
            <select size="10" style="width: 500px;" id="command">
        <option value="contour/lev=(995,1025,5)/color=4" selected>contour/lev=(995,1025,5)/color=4</option>
        <option value="fill/line/lev=(-inf)(995,1025,5)(inf)/color=1/pal=mpl_PSU_plasma/key">fill/line/lev=(-inf)(995,1025,5)(inf)/color=1/pal=mpl_PSU_plasma/key</option>
        <option value="fill/line/lev=(-inf)(995,1025,5)(inf)/color=1/pal=mpl_PSU_viridis/key">fill/line/lev=(-inf)(995,1025,5)(inf)/color=1/pal=mpl_PSU_plasma/key</option>
        </select>
          </td>
        </tr>

      </table>

      <hr>
      <div id='cmd'></div>
      <div id='result'></div>
      <hr>

    </div>
    <!-- /.container -->

  </div>

  <div id="footer">
    <div class="container">
      <p class="text-muted credit"><a target="_blank" href="http://www.lsce.ipsl.fr/en"><span title="Climate and Environment Sciences Laboratory" style="font-weight:bold;">LSCE</span></a>&nbsp;
        <a target="_blank" href="http://www.lsce.ipsl.fr/en"><img src="LSCE_Icon.png" title="Climate and Environment Sciences Laboratory" /></a> and hosted by <a target="_blank" href="http://www.ipsl.fr/en"><span title="Institut Pierre Simon Laplace" style="font-weight:bold;">IPSL</span></a>&nbsp;
        <a target="_blank" href="http://www.ipsl.fr/en"><img src="IPSL_logo.png" title="Institut Pierre Simon Laplace" /></a>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Version 0.1 - 2016/02/15</p>

    </div>
    <!-- /.container -->
  </div>

</body>

</html>
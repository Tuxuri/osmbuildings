<!DOCTYPE html>
<html>
<head>
    <title>OSM Buildings - OpenLayers</title>
    <meta http-equiv="content-type" content="text/html; charset=utf-8">
	<style>
    html, body {
        border: 0;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
    }
    #map {
        height: 100%;
    }
    </style>
    <script src="http://www.openlayers.org/api/OpenLayers.js"></script>
    <!--script src="../dist/OSMBuildings-OpenLayers.js"></script-->
    <script src="scripts.js.php?engine=OpenLayers"></script>
</head>

<body>
    <div id="map"></div>

    <script>
    var map = new OpenLayers.Map('map');
    map.addControl(new OpenLayers.Control.LayerSwitcher());

    var osm = new OpenLayers.Layer.OSM();
    map.addLayer(osm);

    map.setCenter(
        new OpenLayers.LonLat(13.33522, 52.50440)
            .transform(
                new OpenLayers.Projection('EPSG:4326'),
                map.getProjectionObject()
            ),
        17
    );
    new OSMBuildings(map).loadData().setDate(new Date(2013, 2, 15, 10, 30));
    </script>
</body>
</html>



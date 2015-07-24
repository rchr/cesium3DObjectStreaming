
document.ontouchmove = function(e) {e.preventDefault()};

//var extent = Cesium.Rectangle.fromDegrees(13.0475307, 52.3910277, 13.0648685, 52.3998398);
var extent = Cesium.Rectangle.fromDegrees(13.3190346, 52.5065701, 13.3363724, 52.515359);
//var globalJson = "http://localhost:8080/static/co2/co2.json";
var globalJson = "http://localhost:8080/static/co2/co2.json";
var defaultTransparency = 0.75;
var wfsURL = "http://localhost:8080/citydb-wfs/wfs";

Cesium.Camera.DEFAULT_VIEW_FACTOR=0;
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;

// The buildingEnergyViewModel tracks the state of our mini application.
var buildingEnergyViewModel =  {
	energyRatingType : "",
	////heatingType: ["", "STOVE_HEATING", "SELF_CONTAINED_CENTRAL_HEATING", "CENTRAL_HEATING", "NO_INFORMATION", "COMBINED_HEAT_AND_POWER_PLANT", "ELECTRIC_HEATING", "DISTRICT_HEATING", "FLOOR_HEATING", "GAS_HEATING", "WOOD_PELLET_HEATING", "NIGHT_STORAGE_HEATER", "OIL_HEATING", "SOLAR_HEATING", "HEAT_PUMP"],
	selectedHeatingType : "",
	energySource : ["", "NO_INFORMATION", "GEOTHERMAL", "SOLAR_HEATING", "PELLET_HEATING", "GAS", "OIL", "DISTRICT_HEATING", "ELECTRICITY", "COAL", "ACID_GAS", "SOUR_GAS", "LIQUID_GAS", "STEAM_DISTRICT_HEATING", "WOOD", "WOOD_CHIPS", "COAL_COKE", "LOCAL_HEATING", "HEAT_SUPPLY", "LOCAL_HEATING", "BIO_ENERGY", "WIND_ENERGY", "HYDRO_ENERGY", "ENVIRONMENTAL_THERMAL_ENERGY", "COMBINED_HEAT_AND_POWER_FOSSIL_FUELS", "COMBINED_HEAT_AND_POWER_RENEWABLE_ENERGY", "COMBINED_HEAT_AND_POWER_REGENERATIVE_ENERGY", "COMBINED_HEAT_AND_POWER_BIO_ENERGY"],
	selectedEnergySource : "",
	thermalCharacteristic : "",
	co2Emissions : "",
	warmWater : "",
	buildingID : "",
	buildingStreetName : "",
	buildingStreetNumber : "",
	buildingCity : "",
        buildingAddress : ""
		       //buildingAddress : Cesium.knockout.computed(function() {
		//return this.buildingStreetName() + " " + this.buildingStreetNumber() + ", " + this.buildingCity();
	//}, this);

};

// Convert the buildingEnergyViewModel members into knockout observables.
Cesium.knockout.track(buildingEnergyViewModel);
// Bind the buildingEnergyViewModel to the DOM elements of the UI that call for it.
var infoContainer = document.getElementById('infoContainer');
Cesium.knockout.applyBindings(buildingEnergyViewModel, infoContainer);

Cesium.DataSourceDisplay.defaultVisualizersCallback = function (scene, dataSource) {
	var entities = dataSource.entities;
	return [
		new Cesium.ModelVisualizer(scene, entities)
		];
};
var viewer;
try {
	var osmCredit = new Cesium.Credit('©OpenStreetMap contributors', null, 'http://www.openstreetmap.org/copyright');
	viewer = new Cesium.Viewer('cesiumContainer', {
		imageryProvider : new Cesium.OpenStreetMapImageryProvider({
			url : 'http://tile.openstreetmap.de/tiles/osmde',
				credit: osmCredit
		}),
				"timeline":false,
	       "animation":false,
	       "baseLayerPicker":false,
	       "geocoder":false,
	       "infoBox":true,
	       "sceneModePicker":false,
	       "selectionIndicator":true,
	       "navigationHelpButton":true,
	       "navigationInstructionsInitiallyVisible":true,
	       "scene3DOnly":true

	});
} catch (exception) {
	document.getElementById("loadingIndicator").style.display = 'none';
	console.error(exception);
	if (!document.querySelector('.cesium-widget-errorPanel')) {
		window.alert(exception);
	}
}
var canvas =  viewer.scene.canvas;
var scene = viewer.scene;
var dataSources = {};

var getTileStructure = function(){
	var tilesToRender = scene.globe._surface._tilesToRender;
	var tiles = [];
	for(var i = 0; i < tilesToRender.length; i++){
		if(tilesToRender[i].level >= maxLevel){
			var tile = {
				bbox:[tilesToRender[i].rectangle.west,
				tilesToRender[i].rectangle.south,
				tilesToRender[i].rectangle.east,
				tilesToRender[i].rectangle.north],
				level:tilesToRender[i]._level,
				distance:tilesToRender[i]._distance
			}
			tiles.push(tile);
		}
	}
	return tiles;
}
var worker = new Worker('TilesWorkerTiled.js');

worker.addEventListener('message', function(e) {
	var data = e.data;
	switch (data.cmd) {
		case 'add':
			var id =  data.data.id;
			var url = data.data.url;
			var x = data.data.x;
			var y = data.data.y;
			var z = data.data.z;
			var modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
				Cesium.Cartesian3.fromDegrees(x, y, 0.0));
			dataSources[id] = scene.primitives.add(Cesium.Model.fromGltf({
				url : url,
				modelMatrix : modelMatrix,
				scale : 1,
				allowPicking:true
			})
				);
			break;
		case 'remove':
			var ids =  data.ids;
			var counter = 0;
			for(var i = 0; i < ids.length; i++){
				var id = ids[i];
				if(dataSources.hasOwnProperty(id)){
					scene.primitives.remove(dataSources[id]);
					delete dataSources[id];
					counter++
				}
			}
			break;
	}
}, false);

worker.postMessage({'cmd':'initialize', 'url':globalJson});

viewer.scene.postRender.addEventListener(function(scene, time)  {
	worker.postMessage({'cmd':'postRender'});
});

var camera = viewer.camera;
var removeEnd = camera.moveEnd.addEventListener(function() {
	console.log("cameraListenerEnd");
	worker.postMessage({'cmd':'tileStructureChanged', "tiles":getTileStructure(), "maxLevel":maxLevel, "maxModels":maxModels});
});

var showLoadError = function(name, error) {
	var title = 'An error occurred while loading the file: ' + name;
	var message = 'An error occurred while loading the file, which may indicate that it is invalid.  A detailed error report is below:';
	viewer.cesiumWidget.showErrorPanel(title, message, error);
};

// add copyright information for berlin model
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('GFZ', 'http://www.gfz-potsdam.de/fileadmin/templates/images/svg/GFZ_Logo_SVG_klein_de.svg', 'http://www.gfz-potsdam.de'));
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('LoCaL', 'http://www.climate-kic.org/wp-content/themes/climatekic/img/printlogo.gif', 'http://www.climate-kic.org/programmes/low-carbon-city-lab'));
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('ImmobilienScout24', 'http://localhost:8080/static/immoscout.png', 'http://www.immobilienscout24.de/'));
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('Berlin Business Location Center', 'http://localhost:8080/static/berlin.png', 'http://www.businesslocationcenter.de/'));

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	    results = regex.exec(location.search);
	return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var maxLevel = parseInt(getParameterByName("maxLevel"));
var maxModels = parseInt(getParameterByName("maxModels"));

if(isNaN(maxLevel)){
	maxLevel = 16;
}
console.log("Set MaxLevel to " + maxLevel);
if(isNaN(maxModels)){
	maxModels = 500;
}
console.log("Set MaxModels to " + maxModels);

// Enable picking of buildings.
var oldMat;
var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction(
		function (movement) {
			console.log("event happened!");
			var object = scene.pick(movement.position);
			if (Cesium.defined(object) && Cesium.defined(object.node)) {

				if (oldMat != null) {
					oldMat.setValue('transparency', defaultTransparency);
				}

				var materials = object.primitive.gltf.materials;
				var matID = "";
				for (var key in materials) {
					matID = materials[key].name;
				}

				var mat = object.primitive.getMaterial(matID);
				mat.setValue('transparency', 1);

				var cacheKey = object.primitive.cacheKey;
				var splitted = cacheKey.split("/");
				splitted = splitted[splitted.length - 1];
				var id = splitted.split(".")[0];
				requestWFS(id);
				oldMat = mat;
			}
		},
		Cesium.ScreenSpaceEventType.LEFT_CLICK
		);

		/** Request attribute data from WFS. */
		function requestWFS(id) {
			var XHR = new XMLHttpRequest();
			var urlEncodedData = "";
			var urlEncodedDataPairs = [];
			var name;

			XHR.addEventListener('load', function(event) {
				var responseXML = XHR.responseXML;
				nsResolver = document.createNSResolver(responseXML.documentElement);
				getEnergyAttributes(responseXML, nsResolver);
				getBuildingInformation(responseXML, nsResolver);
			});
			XHR.addEventListener('error', function(event) {
				alert('Oups! Something goes wrong.');
			});
			XHR.open('POST', wfsURL);
			XHR.setRequestHeader('Content-Type', 'text/xml');
			var wfsQuery = buildWFSquery(id);
			XHR.send(wfsQuery);
		}

/** Generates getFeature request with given id. */
function buildWFSquery(id) {
	return "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <wfs:GetFeature service=\"WFS\" version=\"2.0.0\" xmlns:wfs=\"http://www.opengis.net/wfs/2.0\"> <wfs:StoredQuery id=\"http://www.opengis.net/def/query/OGC-WFS/0/GetFeatureById\"> <wfs:Parameter name=\"id\">" + id + "</wfs:Parameter> </wfs:StoredQuery> </wfs:GetFeature>";
}

function logg() {
	// TODO: Add upload functionality to server!
	console.log(buildingEnergyViewModel.energySource + ", " + buildingEnergyViewModel.thermalCharacteristic + ", " + buildingEnergyViewModel.co2Emissions);
}

/** Returns energy relevant attributes from given xmlDoc. */
function getEnergyAttributes(xmlDoc, nsResolver) {
	var energy_rating_type  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'energy_rating_type\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var heating_type  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'heating_type\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var heating_type_enev_2014  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'heating_type_enev2014\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var energy_source_enev_2014  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'energy_source_enev2014\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var thermal_characteristic  = xmlDoc.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'thermal_characteristic\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var energy_consumption_contains_warm_water  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'energy_consumption_contains_warm_water\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var co2_emissions = xmlDoc.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'co2_emissions\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var co2 = parseFloat(co2_emissions);
	// CO2 emissions are in g CO2/(a m^2), thus transform them to kg.
	co2 = co2 / 1000;
	co2 = Math.round(co2 * 100) / 100;

	buildingEnergyViewModel.selectedEnergySource = energy_source_enev_2014;
	buildingEnergyViewModel.energyRatingType = energy_rating_type;
	buildingEnergyViewModel.selectedHeatingType = heating_type_enev_2014;
	buildingEnergyViewModel.thermalCharacteristic = thermal_characteristic;
	buildingEnergyViewModel.co2Emissions = co2;
	buildingEnergyViewModel.warmWater = energy_consumption_contains_warm_water;
}

function getBuildingInformation(xmlDoc, nsResolver) {
	var id  = xmlDoc.evaluate('string(/bldg:Building/@gml:id)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var streetName = xmlDoc.evaluate('string(/bldg:Building/bldg:address/core:Address/core:xalAddress/xal:AddressDetails/xal:Country/xal:Locality/xal:Thoroughfare/xal:ThoroughfareName)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var streetNumber = xmlDoc.evaluate('string(/bldg:Building/bldg:address/core:Address/core:xalAddress/xal:AddressDetails/xal:Country/xal:Locality/xal:Thoroughfare/xal:ThoroughfareNumber)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	var city = xmlDoc.evaluate('string(/bldg:Building/bldg:address/core:Address/core:xalAddress/xal:AddressDetails/xal:Country/xal:Locality/xal:LocalityName)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
	
	buildingEnergyViewModel.buildingID = id;
	buildingEnergyViewModel.buildingStreetName = streetName;
	buildingEnergyViewModel.buildingStreetNumber = streetNumber;
	buildingEnergyViewModel.buildingCity = city;
	buildingEnergyViewModel.buildingAddress = streetName + " " + streetNumber + ", " + city;
}



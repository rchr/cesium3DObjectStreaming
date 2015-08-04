/**
 * Module to stream and visualize 3D objects in Cesium.
 * @module
 */
define(["./WFS", "./parseXMLResponse", "./calculateCO2Emissions", "./parseMaxAttrib4Color", "./colorRamp", "jquery"], function(WFS, parseXMLResponse, calculateCO2Emissions, parseMaxAttrib4Color, colorRamp, $) {

	document.ontouchmove = function(e) {e.preventDefault();};

	//var extent = Cesium.Rectangle.fromDegrees(13.0475307, 52.3910277, 13.0648685, 52.3998398);
	var extent = Cesium.Rectangle.fromDegrees(13.3190346, 52.5065701, 13.3363724, 52.515359);
	var globalJson = "http://localhost:8080/static/co2/co2.json";
	var defaultTransparency = 0.75;
	var wfsURL = "http://localhost:8080/citydb-wfs/wfs";
	var attribBuildingID = "BLDG_GLOBAL_ATTRIBS"; // HACK: Use dummy building to get general attributes.
	var mat; 
	var maxAttrib4Color;
	var wfs = new WFS(wfsURL);

	Cesium.Camera.DEFAULT_VIEW_FACTOR=0;
	Cesium.Camera.DEFAULT_VIEW_RECTANGLE = extent;

	var energySources = {
		"": -1,
		"NO_INFORMATION" : -1,
		"GEOTHERMAL": -1,
		"SOLAR_HEATING" : -1,
		"PELLET_HEATING": -1,
		"GAS" : 198,
		"OIL" : 281,
		"DISTRICT_HEATING" : -1,
		"ELECTRICITY" : 922,
		"COAL" : 360,
		"ACID_GAS" : 198,
		"SOUR_GAS" : 198,
		"LIQUID_GAS": -1,
		"STEAM_DISTRICT_HEATING" : -1,
		"WOOD" : 281,
		"WOOD_CHIPS" : -1,
		"COAL_COKE" : -1,
		"LOCAL_HEATING": -1,
		"HEAT_SUPPLY" : -1,
		"BIO_ENERGY" : -1,
		"WIND_ENERGY" : -1,
		"HYDRO_ENERGY" : -1,
		"ENVIRONMENTAL_THERMAL_ENERGY" : -1,
		"COMBINED_HEAT_AND_POWER_FOSSIL_FUELS" : -1,
		"COMBINED_HEAT_AND_POWER_RENEWABLE_ENERGY" : -1,
		"COMBINED_HEAT_AND_POWER_REGENERATIVE_ENERGY" : -1,
		"COMBINED_HEAT_AND_POWER_BIO_ENERGY" : -1
	};

	// The energyVM tracks the state of our mini application.
	var energyVM = {
		energyRatingType : "",
		heatingType : "",
		energySource : "",
		thermalCharacteristic : "",
		co2Emissions : "",
		warmWater : "",
		buildingID : "",
		buildingStreetName : "",
		buildingStreetNumber : "",
		buildingCity : "",
		buildingAddress : function() {
			return this.buildingStreetName + " " + this.buildingStreetNumber + ", " + this.buildingCity;
		},
		energySourceScenario : Object.keys(energySources),
		energySrcScenario : energySources,
		selectedEnergySourceScenario : "",
		thermalCharacteristicScenario : "",
		co2EmissionsScenario : function() {
			if (this.selectedEnergySourceScenario === undefined) {
				return "";
			} else {
				return calculateCO2Emissions(this.thermalCharacteristicScenario,
							     this.energySrcScenario[this.selectedEnergySourceScenario]);
			}
		},
		changeColor : function() {
			var co2 = parseFloat(this.co2EmissionsScenario());
			if (maxAttrib4Color === undefined) {
				alert("maxAttrib4Color not defined!");
			}
			var diffuseColor = calcDiffuseColor(co2, maxAttrib4Color);
			mat.setValue('diffuse', diffuseColor);
		},
		district_heating_emission_factor: ""
	};

	function calcDiffuseColor(co2, max) {
		var rgb = colorRamp(co2, max);
		return new Cesium.Cartesian4(rgb[0], rgb[1], rgb[2], 1);
	}

	// Convert the energyVM members into knockout observables.
	Cesium.knockout.track(energyVM);
	// Bind the energyVM to the DOM elements of the UI that call for it.
	var infoContainer = document.getElementById('infoContainer');
	Cesium.knockout.applyBindings(energyVM, infoContainer);
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
				};
				tiles.push(tile);
			}
		}
		return tiles;
	};
	var worker = new Worker('js/TilesWorkerTiled.js');

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
				dataSources[id] = scene.primitives.add(
					Cesium.Model.fromGltf({
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
					var identifier = ids[i];
					if(dataSources.hasOwnProperty(identifier)){
						scene.primitives.remove(dataSources[identifier]);
						delete dataSources[identifier];
						counter++;
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

	var oldMat;
	var lastColor;
	var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
	handler.setInputAction(
		function (movement) {

			var object = scene.pick(movement.position);
			if (Cesium.defined(object) && Cesium.defined(object.node)) {

				// Get co2 attribute value considered as max value for color calculation.
				if (maxAttrib4Color === undefined || maxAttrib4Color === '') {
					var maxAttribQuery = wfs.createBuildingQuery(attribBuildingID);
					var re = wfs.executeQuery(maxAttribQuery);
					re.done(function(r) {
						maxAttrib4Color = parseMaxAttrib4Color(r);
					}).fail(function(){
						alert("fail");
					});
				}

				if (oldMat != null) {
					oldMat.setValue('transparency', defaultTransparency);
					oldMat.setValue('diffuse', lastColor); // reset color if new picked
				}
				var materials = object.primitive.gltf.materials;
				var matID = "";
				for (var key in materials) {
					matID = materials[key].name;
				}
				mat = object.primitive.getMaterial(matID);
				mat.setValue('transparency', 1);
				var cacheKey = object.primitive.cacheKey;
				var splitted = cacheKey.split("/");
				splitted = splitted[splitted.length - 1];
				var id = splitted.split(".")[0];
				var query = wfs.createBuildingQuery(id);
				var response = wfs.executeQuery(query);
				response.done(function(result) {
					parseXMLResponse(result, energyVM);
				}).fail(function(){
					alert("fail");
				});
				oldMat = mat;
				// get the original color for reuse
				lastColor = mat.getValue('diffuse').clone();
			}
		},
		Cesium.ScreenSpaceEventType.LEFT_CLICK
	);
});

define(function() {

	/** 
	 * Parses the WFS (XML-)response and sets corresponding parameters in the view model.
	 * @alias parseXMLResponse
	 *
	 * @param responseXML
	 * @param viewModel
	 */
	function parseXMLResponse(responseXML, viewModel) {
		var nsResolver = document.createNSResolver(responseXML.documentElement);
		_getEnergyAttributes(responseXML, nsResolver, viewModel);
		_getBuildingInformation(responseXML, nsResolver, viewModel);	
	}

	/**
	 * Extracts energy relevant attributes from given xmlDoc.
	 * @alias _getEnergyAttributes
	 * @private
	 *
	 * @param xmlDoc
	 * @param nsResolver
	 * @param viewModel
	 * @param emissionFactorsVM
	 * @return {undefined}
	 */
	function _getEnergyAttributes(xmlDoc, nsResolver, viewModel) {
		var energy_rating_type  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'energy_rating_type\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var heating_type  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'heating_type\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var heating_type_enev_2014  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'heating_type_enev2014\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var energy_source_enev_2014  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'energy_source_enev2014\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var thermal_characteristic  = xmlDoc.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'thermal_characteristic\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var energy_consumption_contains_warm_water  = xmlDoc.evaluate('string(/bldg:Building/gen:stringAttribute[@name=\'energy_consumption_contains_warm_water\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var dist_emission_factor  = xmlDoc.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'district_heating_emission_factor\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var co2_emissions = xmlDoc.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'co2_emissions\']/gen:value)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var co2 = parseFloat(co2_emissions);
		// CO2 emissions are in g CO2/(a m^2), thus transform them to kg.
		co2 = co2 / 1000;
		co2 = Math.round(co2 * 100) / 100;

		viewModel.energySource = energy_source_enev_2014;
		viewModel.energyRatingType = energy_rating_type;
		viewModel.heatingType = heating_type_enev_2014;
		viewModel.thermalCharacteristic = thermal_characteristic;
		viewModel.co2Emissions = co2;
		viewModel.warmWater = energy_consumption_contains_warm_water;
		viewModel.energySrcScenario.DISTRICT_HEATING = parseFloat(dist_emission_factor);
		viewModel.thermalCharacteristicScenario = thermal_characteristic;
	}

	/**
	 * Extracts building information from given xmlDoc.
	 * @alias _getBuildingInformation
	 * @private
	 *
	 * @param xmlDoc
	 * @param nsResolver
	 * @param viewModel
	 * @return {undefined}
	 */
	function _getBuildingInformation(xmlDoc, nsResolver, viewModel) {
		var id = xmlDoc.evaluate('string(/bldg:Building/@gml:id)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var streetName = xmlDoc.evaluate('string(/bldg:Building/bldg:address/core:Address/core:xalAddress/xal:AddressDetails/xal:Country/xal:Locality/xal:Thoroughfare/xal:ThoroughfareName)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var streetNumber = xmlDoc.evaluate('string(/bldg:Building/bldg:address/core:Address/core:xalAddress/xal:AddressDetails/xal:Country/xal:Locality/xal:Thoroughfare/xal:ThoroughfareNumber)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var city = xmlDoc.evaluate('string(/bldg:Building/bldg:address/core:Address/core:xalAddress/xal:AddressDetails/xal:Country/xal:Locality/xal:LocalityName)', xmlDoc, nsResolver, XPathResult.ANY_TYPE, null).stringValue;

		viewModel.buildingID = id;
		viewModel.buildingStreetName = streetName;
		viewModel.buildingStreetNumber = streetNumber;
		viewModel.buildingCity = city;
	}

	return parseXMLResponse;
});

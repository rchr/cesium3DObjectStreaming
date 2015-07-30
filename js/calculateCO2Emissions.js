define(function() {

	/**
	 * Calculates the co2 emissions from given thermal characteristic and emission factor.
	 * @alias calculateCO2Emissions  
	 *
	 * @param {Number} thermalCharacteristic - The thermal characteristic (energy demand) [kWh/(a m^2)].
	 * @param {Number} emissionFactor - The emission factor [g CO2/kWh].
	 * @return {Number} Calculated CO2 emissions.
	 */
	function calculateCO2Emissions(thermalCharacteristic, emissionFactor) {
		if (emissionFactor == -1) {
			return "No emission factor for energy source";
		} else {
			var emissions = thermalCharacteristic * emissionFactor;
			// convert to kg
			emissions = emissions / 1000;
			// round
			return (Math.round(emissions * 100) / 100).toString();
		}
	}
	return calculateCO2Emissions;	

});

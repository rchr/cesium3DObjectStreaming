define(function() {

	/**
	 * Parse xml and return value of generic attribute MAX_ATTRIB_4_COLOR.
	 * @alias parseMaxAttrib4Color
	 *
	 * @param responseXML
	 * @return {undefined}
	 */
	function parseMinMaxAttrib4Color(responseXML) {
		if (responseXML === undefined || responseXML == '') {
			return null;
		}
		var nsResolver = document.createNSResolver(responseXML.documentElement);
		var maxAttrib  = responseXML.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'MAX_ATTRIB_VAL_4_COLOR\']/gen:value)', responseXML, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var value = parseFloat(maxAttrib);
		value = value / 1000;
		var max = Math.round(value * 100)/100;

		var minAttrib  = responseXML.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'MIN_ATTRIB_VAL_4_COLOR\']/gen:value)', responseXML, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var minValue = parseFloat(minAttrib);
		minValue = minValue / 1000;
		var min = Math.round(minValue * 100)/100;
		return [min, max];

	}

	return parseMinMaxAttrib4Color;
});

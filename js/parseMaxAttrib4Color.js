define(function() {

	/**
	 * Parse xml and return value of generic attribute MAX_ATTRIB_4_COLOR.
	 * @alias parseMaxAttrib4Color
	 *
	 * @param responseXML
	 * @return {undefined}
	 */
	function parseMaxAttrib4Color(responseXML) {
		if (responseXML === undefined || responseXML == '') {
			return null;
		}
		var nsResolver = document.createNSResolver(responseXML.documentElement);
		var maxAttrib  = responseXML.evaluate('string(/bldg:Building/gen:doubleAttribute[@name=\'MAX_ATTRIB_VAL_4_COLOR\']/gen:value)', responseXML, nsResolver, XPathResult.ANY_TYPE, null).stringValue;
		var value = parseFloat(maxAttrib);
		value = value / 1000;
		return Math.round(value * 100)/100;
	}

	return parseMaxAttrib4Color;
});

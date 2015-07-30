/**
 * Module representing a Web Feature Service (WFS).
 * @module 
 */
define(['jquery'], function($) {

	/**
	 * @constructor
	 * @alias WFS 
	 */ 
	var WFS = function(url) {
		this.url = url;
	};

	/**
	 * Create a GetFeatureByID query for building with given id.
	 *
	 * @param {Number | String} id - Feature ID.
	 *
	 */
	WFS.prototype.createBuildingQuery = function(id) {
		return "<?xml version=\"1.0\" encoding=\"UTF-8\"?> <wfs:GetFeature service=\"WFS\" version=\"2.0.0\" xmlns:wfs=\"http://www.opengis.net/wfs/2.0\"> <wfs:StoredQuery id=\"http://www.opengis.net/def/query/OGC-WFS/0/GetFeatureById\"> <wfs:Parameter name=\"id\">" + id + "</wfs:Parameter> </wfs:StoredQuery> </wfs:GetFeature>";
	};

	/**
	 * Executes given query as HTTP-POST.
	 *
	 * @param {String} query - The WFS query.
	 */
	WFS.prototype.executeQuery = function(query) {
		return $.ajax({
 			type: "POST",
			url: this.url,
  			data: query,
  			dataType: "xml"
		});

	};
	return WFS;
});

define(['one-color'], function(onecolor) {
    function colorRamp(value, min, max) {
	if (value < min) {
		value = min;
	} else if (value > max) {
		value = max;
	}

        var r = ((255 * value) / max) / 255;
        var g = ((255 * (max - value)) / max) / 255;
        var rgb = [r, g, 0];
        return rgb;
    }


/*    function colorRamp(value, min, max) {
    	if (value < min) {
		value = min;
	} else if (value > max) {
		value = max;
	}

	var h = '0';
	var v = '100';
	var s = (value - min) / (max - min) * 100;
	var colorString = h + ', ' + s + '%, ' + v + '%';
	var color = onecolor('hsv(' + colorString + ')');
	var rgb = [color.red(), color.green(), color.blue()];
	return rgb;
	
    
    }
*/
    return colorRamp;
});

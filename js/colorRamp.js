define(function() {
    function colorRamp(value, max) {
        var r = ((255 * value) / max) / 255;
        var g = ((255 * (max - value)) / max) / 255;
        var rgb = [r, g, 0];
        return rgb;
    }

    return colorRamp;
});

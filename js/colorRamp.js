define(function() {
    function colorRamp(value, min, max) {
        var r = ((255 * value) / max);
        var g = ((255 * (max - value)) / max);
        var rgb = [Math.round(r), Math.round(g), 0];
        return rgb;
    }
});

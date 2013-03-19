var FlatBuildings = {

    context: null,
    maxHeight: 8,

    init: function (context) {
        this.context = context;
    },

    render: function () {
        var context = this.context;

        context.clearRect(0, 0, width, height);

        // data needed for rendering
        if (!meta || !data ||
            // show on high zoom levels only and avoid rendering during zoom
            zoom < minZoom || isZooming) {
            return;
        }

        var i, il, j, jl,
            item,
            f,
            x, y,
            offX = originX - meta.x,
            offY = originY - meta.y,
            footprint,
            isVisible,
            ax, ay,
            x0, y0
        ;

        context.fillStyle   = roofColorAlpha;
        context.strokeStyle = '#666666';

        for (i = 0, il = data.length; i < il; i++) {
            item = data[i];

            isVisible = false;
            f = item[FOOTPRINT];
            footprint = [];

            for (j = 0, jl = f.length - 1; j < jl; j += 2) {
                footprint[j]     = x = (f[j]     - offX);
                footprint[j + 1] = y = (f[j + 1] - offY);

                // checking footprint is sufficient for visibility
                if (!isVisible) {
                    isVisible = (x > 0 && x < width && y > 0 && y < height);
                }
            }

            if (!isVisible) {
                continue;
            }

            context.beginPath();
            for (j = 0, jl = footprint.length-3; j < jl; j += 2) {
                ax = footprint[j];
                ay = footprint[j + 1];
                if (!j) {
                    context.moveTo(ax, ay);
                } else {
                    shakyLine(x0, y0, ax, ay, context);
                }
                    x0 = ax;
                    y0 = ay;
            }
            context.closePath();
            context.stroke();
            context.fill();
        }
    },

    getMaxHeight: function () {
        return this.maxHeight;
    }
};


function fadeIn() {
    clearInterval(fadeTimer);
    fadeFactor = 0;
    FlatBuildings.render();
    fadeTimer = setInterval(function () {
        fadeFactor += 0.5 * 0.2; // amount * easing
        if (fadeFactor > 1) {
            clearInterval(fadeTimer);
            fadeFactor = 1;
            // unset 'already present' marker
            for (var i = 0, il = data.length; i < il; i++) {
                data[i][IS_NEW] = 0;
            }
        }
        Shadows.render();
        render();
    }, 33);
}

function renderAll() {
    Shadows.render();
    FlatBuildings.render();
    render();
}

function render() {
    context.clearRect(0, 0, width, height);

    // data needed for rendering
    if (!meta || !data ||
        // show on high zoom levels only and avoid rendering during zoom
        zoom < minZoom || isZooming) {
        return;
    }

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        flatMaxHeight = FlatBuildings.getMaxHeight(),
        sortCam = [camX + offX, camY + offY],
        footprint, roof,
        isVisible,
        ax, ay, bx, by,
        a, b, _a, _b
    ;

    // TODO: FlatBuildings are drawn separetely, data has to be split
    data.sort(function (a, b) {
        return distance(b[CENTER], sortCam) / b[HEIGHT] - distance(a[CENTER], sortCam) / a[HEIGHT];
    });

    for (i = 0, il = data.length; i < il; i++) {
        item = data[i];

        if (item[HEIGHT] <= flatMaxHeight) {
            continue;
        }

        isVisible = false;
        f = item[FOOTPRINT];
        footprint = []; // typed array would be created each pass and is way too slow
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

        // when fading in, use a dynamic height
        h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
        // precalculating projection height scale
        m = camZ / (camZ - h);

        // prepare same calculations for min_height if applicable
        if (item[MIN_HEIGHT]) {
            h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            n = camZ / (camZ - h);
        }

        roof = []; // typed array would be created each pass and is way too slow
        context.strokeStyle = '#666666';

        for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j + 1];
            bx = footprint[j + 2];
            by = footprint[j + 3];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);
            _b = project(bx, by, m);

            if (item[MIN_HEIGHT]) {
                a = project(ax, ay, n);
                b = project(bx, by, n);
                ax = a.x;
                ay = a.y;
                bx = b.x;
                by = b.y;
            }

            // backface culling check
            if ((bx - ax) * (_a.y - ay) > (_a.x - ax) * (by - ay)) {
                // depending on direction, set wall shading
                if ((ax < bx && ay < by) || (ax > bx && ay > by)) {
                    context.fillStyle = item[RENDER_COLOR][1] || altColorAlpha;
                } else {
                    context.fillStyle = item[RENDER_COLOR][0] || wallColorAlpha;
                }

                drawShape([
                    bx, by,
                    ax, ay,
                    _a.x, _a.y,
                    _b.x, _b.y
                ], true);
            }
            roof[j]     = _a.x;
            roof[j + 1] = _a.y;
        }

        // fill roof and optionally stroke it
        context.fillStyle   = item[RENDER_COLOR][2] || roofColorAlpha;
        context.strokeStyle = '#333333';
        drawShape(roof, true);
    }
}

var sqrt = Math.sqrt, rand = Math.random;

// http://mrale.ph/blog/2012/11/25/shaky-diagramming.html
function shakyLine(x0, y0, x1, y1, context) {

    context.lineWidth = 2;

    var dx = x1-x0;
    var dy = y1-y0;
    var l = sqrt(dx * dx + dy * dy);

    // Now we need to pick two random points that are placed
    // on different sides of the line that passes through
    // P1 and P2 and not very far from it if length of
    // P1P2 is small.

    var k  = sqrt(l);// 1.5;
    var k1 = rand();
    var k2 = rand();
    var l3 = rand() * k;
    var l4 = rand() * k;

    // Point P3: pick a random point on the line between P0 and P1,
    // then shift it by vector l3l(dy,-dx) which is a line's normal.
    var x3 = x0 + dx * k1 + dy/l * l3;
    var y3 = y0 + dy * k1 - dx/l * l3;

    // Point P3: pick a random point on the line between P0 and P1,
    // then shift it by vector l4l(-dy,dx) which also is a line's normal
    // but points into opposite direction from the one we used for P3.
    var x4 = x0 + dx * k2 - dy/l * l4;
    var y4 = y0 + dy * k2 + dx/l * l4;

    // Draw a bezier curve through points P0, P3, P4, P1.
    // Selection of P3 and P4 makes line "jerk" a little
    // between them but otherwise it will be mostly straight thus
    // creating illusion of being hand drawn.
    context.bezierCurveTo(x3, y3, x4, y4, x1, y1);
}

function drawShape(points, stroke) {
    if (!points.length) {
        return;
    }

    context.beginPath();
    context.moveTo(points[0], points[1]);
    for (var i = 2, il = points.length; i < il; i += 2) {
        shakyLine(points[i-2], points[i-1], points[i], points[i+1], context);
    }

    context.closePath();
    if (stroke) {
        context.stroke();
    }
    context.fill();
}

function project(x, y, m) {
    return {
        x: (x-camX) * m + camX <<0,
        y: (y-camY) * m + camY <<0
    };
}

/*
function debugMarker(x, y, color, size) {
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, PI * 2, true);
    context.closePath();
    context.fill();
}

function debugLine(ax, ay, bx, by, color) {
    context.strokeStyle = color || '#ff0000';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
}
*/

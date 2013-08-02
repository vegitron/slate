// Make this more reasonable - maybe based on line length
var INVALID_AREA_SLOP = 5;
function get_invalid_area_for_bezier(info) {
    return get_invalid_area_for_polygon(info);
}

function get_invalid_area_for_polygon(info) {
    var min_x = Number.MAX_VALUE;
    var min_y = Number.MAX_VALUE;
    var max_x = Number.MIN_VALUE;
    var max_y = Number.MIN_VALUE;

    var points = info.points;
    for (var i = 0; i < points.length; i++) {
        if (points[i].x < min_x) {
            min_x = points[i].x;
        }
        if (points[i].x > max_x) {
            max_x = points[i].x;
        }
        if (points[i].y < min_y) {
            min_y = points[i].y;
        }
        if (points[i].y > max_y) {
            max_y = points[i].y;
        }
    }

    return {
        x: min_x - INVALID_AREA_SLOP,
        y: min_y - INVALID_AREA_SLOP,
        width: max_x - min_x + (2 * INVALID_AREA_SLOP),
        height: max_y - min_y + (2 * INVALID_AREA_SLOP)
    };
}

function get_invalid_area_for_circle(info) {
    return {
        x: info.cx - info.radius - INVALID_AREA_SLOP,
        y: info.cy - info.radius - INVALID_AREA_SLOP,
        width: (info.radius + INVALID_AREA_SLOP) * 2,
        height: (info.radius + INVALID_AREA_SLOP) * 2
    };
}

function get_invalid_area_for_line(info) {
    var points = info.points;

    var x, y, width, height;

    if (points[0].x < points[1].x) {
        x = points[0].x;
        width = points[1].x - points[0].x;
    }
    else {
        x = points[1].x;
        width = points[0].x - points[1].x;
    }

    if (points[0].y < points[1].y) {
        y = points[0].y;
        height = points[1].y - points[0].y;
    }
    else {
        y = points[1].y;
        height = points[0].y - points[1].y;
    }

    return {
        x: x,
        y: y,
        width: width,
        height: height
    };
}

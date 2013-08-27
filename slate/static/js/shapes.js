// Make this more reasonable - maybe based on line length
var INVALID_AREA_SLOP = 8;
function get_invalid_area_for_bezier(info) {
    return get_invalid_area_for_polygon(info);
}

function get_invalid_area_for_polygon(info) {
    var min_x = Number.MAX_VALUE;
    var min_y = Number.MAX_VALUE;
    var max_x = -1 * Number.MAX_VALUE;
    var max_y = -1 * Number.MAX_VALUE;

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
        x: x - INVALID_AREA_SLOP,
        y: y - INVALID_AREA_SLOP,
        width: width + (2 * INVALID_AREA_SLOP),
        height: height + (2 * INVALID_AREA_SLOP)
    };
}

function get_invalid_area_for_text(info) {
    var size = get_text_size(info);

    return {
        x: info.x - INVALID_AREA_SLOP,
        y: info.y - INVALID_AREA_SLOP,
        width: size.width + (2 * INVALID_AREA_SLOP),
        height: size.height + (2 * INVALID_AREA_SLOP)
    };
}

function get_text_size(info) {
    var offscreen = $("#offscreen_text_test");

    var escaped_text = offscreen.text(info.text).html();

    var test_html = escaped_text.replace(/\n/g, "<br/>");
    test_html = test_html.replace(/ /g, "&nbsp;");
    offscreen.html(test_html);

    offscreen.css("font-size", info.font_size);
    offscreen.css("font-family", info.font_face);

    return {
        width: offscreen.width(),
        height: offscreen.height()
    };
}

// XXX - this needs to accomodate shape rotation
function get_selection_highlight_corners(shape) {
    var INSET_FROM_COVERAGE = 8;
    return [
        { x: shape.coverage_area.x + INSET_FROM_COVERAGE / 2, y: shape.coverage_area.y + INSET_FROM_COVERAGE / 2 },
        { x: shape.coverage_area.x + INSET_FROM_COVERAGE / 2, y: shape.coverage_area.y + INSET_FROM_COVERAGE / 2 + shape.coverage_area.height - INSET_FROM_COVERAGE },
        { x: shape.coverage_area.x + INSET_FROM_COVERAGE / 2 + shape.coverage_area.width - INSET_FROM_COVERAGE, y: shape.coverage_area.y + INSET_FROM_COVERAGE / 2 + shape.coverage_area.height - INSET_FROM_COVERAGE},
        { x: shape.coverage_area.x + INSET_FROM_COVERAGE / 2 + shape.coverage_area.width - INSET_FROM_COVERAGE, y: shape.coverage_area.y + INSET_FROM_COVERAGE / 2 },
        { x: shape.coverage_area.x + INSET_FROM_COVERAGE / 2, y: shape.coverage_area.y + INSET_FROM_COVERAGE / 2 }
    ];
}

function move_polygon_display_xy(shape, dx, dy) {
    for (var i = 0; i < shape.values.points.length; i++) {
        var point = shape.values.points[i];
        point.x += dx;
        point.y += dy;
    }
}

function move_text_display_xy(shape, dx, dy) {
    shape.values.x += dx;
    shape.values.y += dy;
}

function move_circle_display_xy(shape, dx, dy) {
    shape.values.cx += dx;
    shape.values.cy += dy;
}

function move_line_display_xy(shape, dx, dy) {
    // lines use the same position rep that polygons do.
    move_polygon_display_xy(shape, dx, dy);
}

function move_bezier_display_xy(shape, dx, dy) {
    // beziers use the same position rep that polygons do.
    move_polygon_display_xy(shape, dx, dy);
}

function move_display_xy(shape, dx, dy) {
    shape.coverage_area.x += dx;
    shape.coverage_area.y += dy;

    if (shape.shape === 'circle') {
        return move_circle_display_xy(shape, dx, dy);
    }
    else if (shape.shape === 'polygon') {
        return move_polygon_display_xy(shape, dx, dy);
    }
    else if (shape.shape === 'line') {
        return move_line_display_xy(shape, dx, dy);
    }
    else if (shape.shape === 'bezier') {
        return move_bezier_display_xy(shape, dx, dy);
    }
    else if (shape.shape === 'text') {
        return move_text_display_xy(shape, dx, dy);
    }
    else {
        throw("Don't know how to set xy for "+shape.shape);
    }
}

function set_movement_proxy_display(shape) {
    if (shape.shape === 'text') {
        shape.values.color = 'rgba(0, 0, 0, .7)';
    }
    else {
        shape.values.border_color = 'rgba(0, 0, 0, .7)';
        shape.values.fill_color = 'rgba(0, 0, 0, .2)';
    }
}


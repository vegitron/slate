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
    var text = info.reflowed_text || info.text;

    var size = get_text_size({
        text: text,
        font_size: info.font_size,
        font_face: info.font_face
    });

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

function resize_circle_display(shape, width_scale, height_scale) {
    var original_radius = shape.values.radius;
    if (width_scale !== null) {
        shape.values.radius *= width_scale;
    }
    else {
        shape.values.radius *= height_scale;
    }

    if (shape.values.radius < 0) {
        shape.values.radius *= -1;
    }

    if (width_scale) {
        shape.values.cx += shape.values.radius - original_radius;
    }
    if (height_scale) {
        shape.values.cy += shape.values.radius - original_radius;
    }
}

function resize_polygon_display(shape, width_scale, height_scale) {

    // Unlike most things, this actually needs to be based on the
    // real left/top of the shape, otherwise the anchor points move
    var left_pos = Number.MAX_VALUE, top_pos = Number.MAX_VALUE;
    for (var i = 0; i < shape.values.points.length; i++) {
        var point = shape.values.points[i];
        if (point.x < left_pos) {
            left_pos = point.x;
        }
        if (point.y < top_pos) {
            top_pos = point.y;
        }
    }

    for (var i = 0; i < shape.values.points.length; i++) {
        var point = shape.values.points[i];
        var new_x = left_pos + ((point.x - left_pos) * width_scale);
        point.x = new_x;
        point.y = top_pos + ((point.y - top_pos) * height_scale);
    }
}

function resize_line_display(shape, width_scale, height_scale) {
    return resize_polygon_display(shape, width_scale, height_scale);
}

function resize_bezier_display(shape, width_scale, height_scale) {
    return resize_polygon_display(shape, width_scale, height_scale);
}

function resize_text_display(shape, width_scale, height_scale) {
    var initial_text_for_size = shape.values.reflowed_text || shape.values.text;
    var text_size = get_text_size({
        text: initial_text_for_size,
        font_size: shape.values.font_size,
        font_face: shape.values.font_face
    });

    var new_width = text_size.width * width_scale;

    if (text_size < new_width) {
        delete shape.values.reflowed_text;
        return;
    }


    var reflowed_text = reflow_text(new_width);
    shape.values.reflowed_text = reflowed_text;

    function reflow_text(new_width) {
        var original_lines = shape.values.text.split(/\r?\n/);
        var reflowed_lines = [];

        if (new_width < 0) {
            new_width *= -1;
        }

        for (var i = 0; i < original_lines.length; i++) {
            var reflowed_line = get_reflowed_line(original_lines[i], new_width);
            reflowed_lines = reflowed_lines.concat(reflowed_line);
        }

        return reflowed_lines.join("\n");
    }

    function get_reflowed_line(line, width) {
        var words = line.split(/ /);

        return get_reflowed_words(words, width);
    }

    function get_reflowed_words(words, width) {
        if (words.length === 1) {
            return [words[0]];
        }

        for (var i = words.length + 1; i > 0; i--) {
            var test_string = words.slice(0, i).join(" ");
            var sub_size = get_text_size({
                text: test_string,
                font_size: shape.values.font_size,
                font_face: shape.values.font_face
            });

            if (sub_size.width < width) {
                var reflowed = [];
                reflowed.push(test_string);

                if (i < words.length) {
                    var new_matches = get_reflowed_words(words.slice(i), width);
                    reflowed = reflowed.concat(new_matches);
                }

                return reflowed;
            }
        }

        var reflowed = [];
        reflowed.push(words[0]);

        if (words.length > 1) {
            var remaining = words.slice(1).join(" ");
            reflowed = reflowed.concat(get_reflowed_words(words.slice(1), width));
        }
        return reflowed;
    }
}

function resize_shape(shape, width_scale, height_scale) {
    if (shape.shape === 'circle') {
        return resize_circle_display(shape, width_scale, height_scale);
    }
    else if (shape.shape === 'polygon') {
        return resize_polygon_display(shape, width_scale, height_scale);
    }
    else if (shape.shape === 'line') {
        return resize_line_display(shape, width_scale, height_scale);
    }
    else if (shape.shape === 'bezier') {
        return resize_bezier_display(shape, width_scale, height_scale);
    }
    else if (shape.shape === 'text') {
        return resize_text_display(shape, width_scale, height_scale);
    }
    else {
        throw("Don't know how to resize "+shape.shape);
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


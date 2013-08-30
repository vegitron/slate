Slate.Shape.Polygon = (function ($) {
    "use strict";
    function get_invalid_area(info) {
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

    function move(shape, dx, dy) {
        for (var i = 0; i < shape.values.points.length; i++) {
            var point = shape.values.points[i];
            point.x += dx;
            point.y += dy;
        }
    }

    function resize(shape, width_scale, height_scale) {

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

    return {
        get_invalid_area: get_invalid_area,
        move: move,
        resize: resize
    };

})(jQuery);

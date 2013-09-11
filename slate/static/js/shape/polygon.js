Slate.Shape.Polygon = (function ($) {
    "use strict";
    function get_invalid_area(info) {
        var min_x = Number.MAX_VALUE,
            min_y = Number.MAX_VALUE,
            max_x = -1 * Number.MAX_VALUE,
            max_y = -1 * Number.MAX_VALUE,
            points = info.points,
            i;

        for (i = 0; i < points.length; i++) {
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
        var i,
            point;
        for (i = 0; i < shape.values.points.length; i++) {
            point = shape.values.points[i];
            point.x += dx;
            point.y += dy;
        }
    }

    function resize(shape, width_scale, height_scale) {

        // Unlike most things, this actually needs to be based on the
        // real left/top of the shape, otherwise the anchor points move
        var left_pos = Number.MAX_VALUE,
            top_pos = Number.MAX_VALUE,
            i,
            point,
            new_x;
        for (i = 0; i < shape.values.points.length; i++) {
            point = shape.values.points[i];
            if (point.x < left_pos) {
                left_pos = point.x;
            }
            if (point.y < top_pos) {
                top_pos = point.y;
            }
        }

        for (i = 0; i < shape.values.points.length; i++) {
            point = shape.values.points[i];
            new_x = left_pos + ((point.x - left_pos) * width_scale);
            point.x = new_x;
            point.y = top_pos + ((point.y - top_pos) * height_scale);
        }
    }

    function rotate(shape, angle) {
        var coverage_area = shape.coverage_area,
            points = shape.values.points,
            center_x = coverage_area.x + (coverage_area.width / 2),
            center_y = coverage_area.y + (coverage_area.height / 2),
            i,
            tmp_x,
            tmp_y,
            offset_x,
            offset_y,
            sin_angle = Math.sin(angle * Math.PI / 180),
            cos_angle = Math.cos(angle * Math.PI / 180);

        for (i = 0; i < points.length; i++) {

            offset_x = points[i].x - center_x;
            offset_y = points[i].y - center_y;

            tmp_x = (offset_x * cos_angle) - (offset_y * sin_angle);
            tmp_y = (offset_x * sin_angle) + (offset_y * cos_angle);

            points[i].x = tmp_x + center_x;
            points[i].y = tmp_y + center_y;

        }
    }

    return {
        get_invalid_area: get_invalid_area,
        move: move,
        rotate: rotate,
        resize: resize
    };

})(jQuery);

Slate.Shape.Line = (function ($) {
    "use strict";

    function get_invalid_area(info) {
        var points = info.points;

        var x, y, width, height;

        if (points[0].x < points[1].x) {
            x = points[0].x;
            width = points[1].x - points[0].x;
        } else {
            x = points[1].x;
            width = points[0].x - points[1].x;
        }

        if (points[0].y < points[1].y) {
            y = points[0].y;
            height = points[1].y - points[0].y;
        } else {
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


    function move(shape, dx, dy) {
        Slate.Shape.Polygon.move(shape, dx, dy);
    }

    function resize(shape, width_scale, height_scale) {
        return Slate.Shape.Polygon.resize(shape, width_scale, height_scale);
    }

    return {
        get_invalid_area: get_invalid_area,
        move: move,
        resize: resize
    };
})(jQuery);

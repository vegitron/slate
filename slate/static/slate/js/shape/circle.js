Slate.Shape.Circle = (function ($) {
    "use strict";

    function get_invalid_area(info) {
        return {
            x: info.cx - info.radius - INVALID_AREA_SLOP,
            y: info.cy - info.radius - INVALID_AREA_SLOP,
            width: (info.radius + INVALID_AREA_SLOP) * 2,
            height: (info.radius + INVALID_AREA_SLOP) * 2
        };
    }

    function move(shape, dx, dy) {
        shape.values.cx += dx;
        shape.values.cy += dy;
    }

    function resize(shape, width_scale, height_scale) {
        var original_radius = shape.values.radius;
        if (width_scale !== null) {
            shape.values.radius *= width_scale;
        } else {
            shape.values.radius *= height_scale;
        }

        if (width_scale) {
            shape.values.cx += shape.values.radius - original_radius;
        }
        if (height_scale) {
            shape.values.cy += shape.values.radius - original_radius;
        }

    }

    return {
        get_invalid_area: get_invalid_area,
        move: move,
        resize: resize
    };
})(jQuery);

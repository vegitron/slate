Slate.Shape.Bezier = (function ($) {
    "use strict";

    function get_invalid_area(info) {
        return Slate.Shape.Polygon.get_invalid_area(info);
    }

    function move(shape, dx, dy) {
        // beziers use the same position rep that polygons do.
        Slate.Shape.Polygon.move(shape, dx, dy);
    }

    function resize(shape, width_scale, height_scale) {
        return Slate.Shape.Polygon.resize(shape, width_scale, height_scale);
    }

    function rotate(shape, angle) {
        return Slate.Shape.Polygon.rotate(shape, angle);
    }

    return {
        get_invalid_area: get_invalid_area,
        move: move,
        rotate: rotate,
        resize: resize
    };
})(jQuery);

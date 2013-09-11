var INVALID_AREA_SLOP = 8;

Slate.Shape = (function ($) {
    "use strict";
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

    function get_invalid_area(shape) {
        if (shape.shape === 'circle') {
            return Slate.Shape.Circle.get_invalid_area(shape.values);
        } else if (shape.shape === 'polygon') {
            return Slate.Shape.Polygon.get_invalid_area(shape.values);
        } else if (shape.shape === 'line') {
            return Slate.Shape.Line.get_invalid_area(shape.values);
        } else if (shape.shape === 'bezier') {
            return Slate.Shape.Bezier.get_invalid_area(shape.values);
        } else if (shape.shape === 'text') {
            return Slate.Shape.Text.get_invalid_area(shape.values);
        }
    }


    function move_display_xy(shape, dx, dy) {
        shape.coverage_area.x += dx;
        shape.coverage_area.y += dy;

        if (shape.shape === 'circle') {
            return Slate.Shape.Circle.move(shape, dx, dy);
        }
        else if (shape.shape === 'polygon') {
            return Slate.Shape.Polygon.move(shape, dx, dy);
        }
        else if (shape.shape === 'line') {
            return Slate.Shape.Line.move(shape, dx, dy);
        }
        else if (shape.shape === 'bezier') {
            return Slate.Shape.Bezier.move(shape, dx, dy);
        }
        else if (shape.shape === 'text') {
            return Slate.Shape.Text.move(shape, dx, dy);
        }
        else {
            throw("Don't know how to set xy for "+shape.shape);
        }
    }


    function resize_shape(shape, width_scale, height_scale) {
        if (shape.shape === 'circle') {
            return Slate.Shape.Circle.resize(shape, width_scale, height_scale);
        }
        else if (shape.shape === 'polygon') {
            return Slate.Shape.Polygon.resize(shape, width_scale, height_scale);
        }
        else if (shape.shape === 'line') {
            return Slate.Shape.Line.resize(shape, width_scale, height_scale);
        }
        else if (shape.shape === 'bezier') {
            return Slate.Shape.Bezier.resize(shape, width_scale, height_scale);
        }
        else if (shape.shape === 'text') {
            return Slate.Shape.Text.resize(shape, width_scale, height_scale);
        }
        else {
            throw("Don't know how to resize "+shape.shape);
        }

    }

    function rotate_shape(shape, angle) {
        if (shape.shape === "circle") {
            // Not even gonna try
        }
        else if (shape.shape === "polygon") {
            Slate.Shape.Polygon.rotate(shape, angle);
        }
        else if (shape.shape === "line") {
            Slate.Shape.Line.rotate(shape, angle);
        }
        else if (shape.shape === "bezier") {
            Slate.Shape.Bezier.rotate(shape, angle);
        }
        else if (shape.shape === "text") {
            Slate.Shape.Text.rotate(shape, angle);
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

    return {
        get_selection_highlight_corners: get_selection_highlight_corners,
        get_invalid_area: get_invalid_area,
        move_display_xy: move_display_xy,
        resize_shape: resize_shape,
        rotate_shape: rotate_shape,
        set_movement_proxy_display: set_movement_proxy_display
    };
})(jQuery);

Slate.Select = (function ($) {
    "use strict";

    var ROTATE_SHAPE_OFFSET = 15;

    // This tracks the actively selected shape on the artboard
    var current_shape = null;

    function find_select_object(x, y) {
        // Find the thing in the "highest" layer - lowest id, with the highest
        // z-index

        var intersecting_shapes = Slate.Layer.find_intersecting_shapes({ x: x, y: y, width: 1, height: 1 });

        var min_layer = Number.MAX_VALUE;
        var max_zindex = 0;
        var selected_shape;

        // intersecting shapes consumers need to track this, even if they don't care about it
        for (var i = 0; i < intersecting_shapes.length; i++) {
            var shape = intersecting_shapes[i];
            shape.coverage_area.overlaps = false;
            if (shape.layer < min_layer) {
                min_layer = shape.layer;
                max_zindex = shape.z_index;
                selected_shape = shape;
            }
            else if (shape.layer == min_layer  && shape.z_index > max_zindex) {
                min_layer = shape.layer;
                max_zindex = shape.z_index;
                selected_shape = shape;
            }
        }


        if (selected_shape) {
            var last_selected = get_selected_shape();

            if (last_selected) {
                Slate.Layer.invalidate_rectangle(last_selected.coverage_area);
                last_selected.selected_shape = false;
            }

            Slate.Layer.invalidate_rectangle(selected_shape.coverage_area);
            selected_shape.selected_shape = true;
            set_selected_shape(selected_shape);

            Slate.Attributes.load_attributes_for_shape(selected_shape);

            Slate.Layer.redraw_regions();
        }
        else {
            deselect_current_object();
        }

    }

    function deselect_current_object() {
        var last_selected = get_selected_shape();

        if (last_selected) {
            Slate.Layer.invalidate_rectangle(last_selected.coverage_area);
            last_selected.selected_shape = false;
        }

        Slate.Event.clear_mousedown_regions();
        Slate.Event.clear_cursor_regions();
        set_selected_shape(null);
        Slate.Attributes.load_attributes_for_new_object();
        Slate.Attributes.hide_shape_attribute_controls();

        Slate.Layer.redraw_regions();
    }

    function show_selected_object_handles() {
        if (!get_selected_shape()) {
            return;
        }

        Slate.Event.clear_mousedown_regions();
        Slate.Event.clear_cursor_regions();

        var corners = Slate.Shape.get_selection_highlight_corners(get_selected_shape());
        var canvas = document.getElementById("artboard");
        var context = canvas.getContext("2d");

        var origin = Slate.Artboard.get_canvas_origin();

        context.save();
        context.beginPath();
        context.moveTo(Slate.Artboard.canvas_to_screen_zoom(corners[0].x + origin.x), Slate.Artboard.canvas_to_screen_zoom(corners[0].y + origin.y));
        for (var i = 1; i < corners.length; i++) {
            context.lineTo(Slate.Artboard.canvas_to_screen_zoom(corners[i].x + origin.x), Slate.Artboard.canvas_to_screen_zoom(corners[i].y + origin.y));
        }

        // Not implemented in all browsers, like firefox...
        if (context.setLineDash) {
            context.setLineDash([4, 4]);
        }
        context.strokeStyle = 'grey';
        context.lineWidth = 1;

        context.stroke();

        context.restore();

        // XXX - these squares should respect shape rotation when that's implemented

        context.save();
        context.fillStyle = 'white';
        context.strokeStyle = 'grey';
        context.lineWidth = 2;

        var corner_cursors = ['sw-resize', 'se-resize', 'ne-resize', 'nw-resize'];
        var edge_cursors = ['w-resize', 's-resize', 'e-resize', 'n-resize'];

        var corner_event_data = [
            { select: { left: true, bottom: true }, cursor: 'sw-resize' },
            { select: { right: true, bottom: true }, cursor: 'se-resize' },
            { select: { right: true, top: true }, cursor: 'ne-resize' },
            { select: { left: true, top: true }, cursor: 'nw-resize' }
        ];

        var edge_event_data = [
            { select: { left: true }, cursor: 'w-resize' },
            { select: { bottom: true }, cursor: 's-resize' },
            { select: { right: true }, cursor: 'e-resize' },
            { select: { top: true }, cursor: 'n-resize' }
        ];

        var SELECT_SQUARE_SIZE = 5;
        for (var i = 1; i < corners.length; i++) {
            context.beginPath();

            var x_pos = corners[i].x - SELECT_SQUARE_SIZE / 2 + origin.x;
            var y_pos = corners[i].y - SELECT_SQUARE_SIZE / 2 + origin.y;

            x_pos = Slate.Artboard.canvas_to_screen_zoom(x_pos);
            y_pos = Slate.Artboard.canvas_to_screen_zoom(y_pos);

            context.rect(x_pos, y_pos, SELECT_SQUARE_SIZE, SELECT_SQUARE_SIZE);
            context.closePath();
            context.stroke();
            context.fill();

            Slate.Event.set_cursor_region({
                x: x_pos,
                y: y_pos,
                width: SELECT_SQUARE_SIZE,
                height: SELECT_SQUARE_SIZE
            }, corner_cursors[i-1]);

            Slate.Event.set_mousedown_region({
                x: x_pos,
                y: y_pos,
                width: SELECT_SQUARE_SIZE,
                height: SELECT_SQUARE_SIZE
            }, Slate.ResizeShape.start_shape_resize, [ corner_event_data[i - 1] ]);

            context.beginPath();
            var mid_x = (corners[i].x + corners[i - 1].x) / 2;
            var mid_y = (corners[i].y + corners[i - 1].y) / 2;

            x_pos = mid_x - SELECT_SQUARE_SIZE / 2 + origin.x;
            y_pos = mid_y - SELECT_SQUARE_SIZE / 2 + origin.y;

            x_pos = Slate.Artboard.canvas_to_screen_zoom(x_pos);
            y_pos = Slate.Artboard.canvas_to_screen_zoom(y_pos);

            context.rect(x_pos, y_pos, SELECT_SQUARE_SIZE, SELECT_SQUARE_SIZE);
            context.closePath();

            context.stroke();
            context.fill();

            Slate.Event.set_cursor_region({
                x: x_pos,
                y: y_pos,
                width: SELECT_SQUARE_SIZE,
                height: SELECT_SQUARE_SIZE
            }, edge_cursors[i-1]);

            Slate.Event.set_mousedown_region({
                x: x_pos,
                y: y_pos,
                width: SELECT_SQUARE_SIZE,
                height: SELECT_SQUARE_SIZE
            }, Slate.ResizeShape.start_shape_resize, [ edge_event_data[i-1] ]);

        }

        context.restore();
        // Add this last, so the corners get priority w/ the cursor
        var move_x = Slate.Artboard.canvas_to_screen_zoom(corners[0].x + origin.x),
            move_y = Slate.Artboard.canvas_to_screen_zoom(corners[0].y + origin.y),
            move_width = Slate.Artboard.canvas_to_screen_zoom(corners[2].x - corners[0].x),
            move_height = Slate.Artboard.canvas_to_screen_zoom(corners[2].y - corners[0].y);

        Slate.Event.set_cursor_region({
            x: move_x,
            y: move_y,
            width: move_width,
            height: move_height
        }, 'move');

        Slate.Event.set_mousedown_region({
            x: move_x,
            y: move_y,
            width: move_width,
            height: move_height
        }, Slate.MoveShape.start_selected_shape_move);

        // And now the rotate events, currently just a rectangle outside the shape rectangle
        var rotate_x = Slate.Artboard.canvas_to_screen_zoom(corners[0].x + origin.x - ROTATE_SHAPE_OFFSET),
            rotate_y = Slate.Artboard.canvas_to_screen_zoom(corners[0].y + origin.y - ROTATE_SHAPE_OFFSET),
            rotate_width = Slate.Artboard.canvas_to_screen_zoom(corners[2].x - corners[0].x + (ROTATE_SHAPE_OFFSET * 2)),
            rotate_height = Slate.Artboard.canvas_to_screen_zoom(corners[2].y - corners[0].y + (ROTATE_SHAPE_OFFSET * 2));

        Slate.Event.set_cursor_region({
            x: rotate_x,
            y: rotate_y,
            width: rotate_width,
            height: rotate_height
        }, 'wait');

        Slate.Event.set_mousedown_region({
            x: rotate_x,
            y: rotate_y,
            width: rotate_width,
            height: rotate_height
        }, Slate.RotateShape.start_shape_rotate, [get_selected_shape()]);

    }

    function get_selected_shape() {
        return current_shape;
    }

    function set_selected_shape(shape) {
        current_shape = shape;
    }

    return {
        show_selected_object_handles: show_selected_object_handles,
        find_select_object: find_select_object,
        deselect_current_object: deselect_current_object,
        get_selected_shape: get_selected_shape
    };

})(jQuery);

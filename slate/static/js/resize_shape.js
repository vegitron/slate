Slate.ResizeShape = (function ($) {
    "use strict";
    function start_shape_resize(x, y, box_data) {
        var left_pos = Number.MAX_VALUE,
            top_pos = Number.MAX_VALUE,
            right_pos = -1 * Number.MAX_VALUE,
            bottom_pos = -1 * Number.MAX_VALUE,
            shape = Slate.Select.get_selected_shape(),
            size_test_text,
            text_size,
            i,
            point,
            obj_x,
            obj_y,
            obj_width,
            obj_height,
            origin,
            screen_x,
            screen_y,
            cursor,
            canvas,
            move_differential_x,
            move_differential_y;


        if (shape.shape === "text") {
            left_pos = shape.values.x;
            top_pos = shape.values.y;

            size_test_text = shape.values.reflowed_text || shape.values.text;

            text_size = Slate.Shape.Text.get_text_size({
                text: size_test_text,
                font_size: shape.values.font_size,
                font_face: shape.values.font_face
            });

            right_pos = left_pos + text_size.width;
            bottom_pos = top_pos + text_size.height;
        } else if (shape.shape === "circle") {
            left_pos = shape.values.cx - shape.values.radius;
            right_pos = shape.values.cx + shape.values.radius;
            top_pos = shape.values.cy - shape.values.radius;
            bottom_pos = shape.values.cy + shape.values.radius;
        } else {
            for (i = 0; i < shape.values.points.length; i++) {
                point = shape.values.points[i];
                if (point.x < left_pos) {
                    left_pos = point.x;
                }
                if (point.x > right_pos) {
                    right_pos = point.x;
                }
                if (point.y < top_pos) {
                    top_pos = point.y;
                }
                if (point.y > bottom_pos) {
                    bottom_pos = point.y;
                }
            }
        }

        obj_x = left_pos;
        obj_y = top_pos;
        obj_width = right_pos - left_pos;
        obj_height = bottom_pos - top_pos;

        origin = Slate.Artboard.get_canvas_origin();
        screen_x = obj_x + origin.x;
        screen_y = obj_y + origin.y;

        cursor = box_data.cursor;
        canvas = document.getElementById("draw_surface");
        Slate.Event.clear_cursor_regions();
        Slate.Event.set_cursor_region({
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        }, cursor);


        // For resizing left/top, we need the differential between
        // the coverage area and the actual shape area, since moving
        // the shape uses coverage area.
        var selected_object = Slate.Select.get_selected_shape();
        move_differential_x = selected_object.coverage_area.x - left_pos;
        move_differential_y = selected_object.coverage_area.y - top_pos;

        function update_shape_data(shape, ev) {
            var width_scale = null,
                height_scale = null,

                origin = Slate.Artboard.get_canvas_origin(),
                canvas_x = ev.clientX - origin.x,
                canvas_y = ev.clientY - origin.y,
                x_diff,
                new_width,
                original_right,
                y_diff,
                original_bottom,
                new_height,
                original_radius,
                diff;

            if (box_data.select.left) {
                x_diff = canvas_x - obj_x;
                new_width = obj_width - x_diff;
                width_scale = new_width / obj_width;
            }
            if (box_data.select.right) {
                original_right = obj_x + obj_width;
                x_diff = original_right - canvas_x;
                new_width = obj_width - x_diff;
                width_scale = new_width / obj_width;
            }
            if (box_data.select.top) {
                y_diff = canvas_y - obj_y;
                new_height = obj_height - y_diff;
                height_scale = new_height / obj_height;
            }
            if (box_data.select.bottom) {
                original_bottom = obj_y + obj_height;
                y_diff = original_bottom - canvas_y;
                new_height = obj_height - y_diff;
                height_scale = new_height / obj_height;
            }

            if (shape.shape === "circle") {
                original_radius = shape.values.radius;
                // XXX - this should probably allow circles to deform into an oval
                if (height_scale !== null && width_scale !== null) {
                    if (height_scale > width_scale) {
                        height_scale = width_scale;
                    } else {
                        width_scale = height_scale;
                    }
                }
            } else {
                if (height_scale === null) {
                    height_scale = 1.0;
                }
                if (width_scale === null) {
                    width_scale = 1.0;
                }
            }

            Slate.Shape.resize_shape(shape, width_scale, height_scale);

            if (shape.shape === "circle") {
                if (box_data.select.left) {
                    Slate.Shape.move_display_xy(shape,  (original_radius - shape.values.radius) * 2, 0);
                }
                if (box_data.select.top) {
                    Slate.Shape.move_display_xy(shape, 0, (original_radius - shape.values.radius) * 2);
                }

                if (shape.values.radius < 0) {
                    shape.values.radius *= -1;
                }
            } else {
                if (box_data.select.left) {
                    diff = Slate.MoveShape.get_position_differential(shape, ev);
                    Slate.Shape.move_display_xy(shape, diff.dx + move_differential_y, 0);
                }
                if (box_data.select.top) {
                    diff = Slate.MoveShape.get_position_differential(shape, ev);
                    Slate.Shape.move_display_xy(shape, 0, diff.dy + move_differential_y);
                }
            }
        }

        function handle_mouse_move(ev) {
            // Keeps dragging up from selecting text in the shape dialog
            document.getSelection().removeAllRanges();
            var movement_proxy = JSON.parse(JSON.stringify(Slate.Select.get_selected_shape())),
                canvas = document.getElementById("draw_surface"),
                context = canvas.getContext("2d"),
                origin = Slate.Artboard.get_canvas_origin();
            Slate.Shape.set_movement_proxy_display(movement_proxy);
            update_shape_data(movement_proxy, ev);


            context.clearRect(0, 0, canvas.width, canvas.height);

            Slate.Layer.draw_shapes(context, [movement_proxy], origin);
        }

        function handle_mouse_up(ev) {
            var save_obj = JSON.parse(JSON.stringify(Slate.Select.get_selected_shape())),
                canvas = document.getElementById("draw_surface"),
                context = canvas.getContext("2d");

            update_shape_data(save_obj, ev);
            Slate.Drawing.update_shape_on_artboard(save_obj);

            context.clearRect(0, 0, canvas.width, canvas.height);

            $(window).unbind("mousemove", handle_mouse_move);
            $(window).unbind("mouseup", handle_mouse_up);
        }

        $(window).on("mousemove", { x_offset: x - screen_x, y_offset: y - screen_y}, handle_mouse_move);
        $(window).on("mouseup", { x_offset: x - screen_x, y_offset: y - screen_y}, handle_mouse_up);

        return false;
    }

    return {
        start_shape_resize: start_shape_resize
    };
})(jQuery);

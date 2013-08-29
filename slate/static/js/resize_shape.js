function start_shape_resize(x, y, box_data) {
    var left_pos = Number.MAX_VALUE,
        top_pos = Number.MAX_VALUE,
        right_pos = -1 * Number.MAX_VALUE,
        bottom_pos = -1 * Number.MAX_VALUE;

    var shape = app_context.select_state.selected_object;

    if (shape.shape === "text") {
        left_pos = shape.values.x;
        top_pos = shape.values.y;

        var size_test_text = shape.values.reflowed_text || shape.values.text;

        var text_size = get_text_size({
            text: size_test_text,
            font_size: shape.values.font_size,
            font_face: shape.values.font_face
        });

        right_pos = left_pos + text_size.width;
        bottom_pos = top_pos + text_size.height;
    }
    else if (shape.shape === "circle") {
        left_pos = shape.values.cx - shape.values.radius;
        right_pos = shape.values.cx + shape.values.radius;
        top_pos = shape.values.cy - shape.values.radius;
        bottom_pos = shape.values.cy + shape.values.radius;
    }
    else {
        for (var i = 0; i < shape.values.points.length; i++) {
            var point = shape.values.points[i];
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

    var obj_x = left_pos;
    var obj_y = top_pos;
    var obj_width = right_pos - left_pos;
    var obj_height = bottom_pos - top_pos;

    var origin = get_canvas_origin();
    var screen_x = obj_x + origin.x;
    var screen_y = obj_y + origin.y;

    var cursor = box_data.cursor;
    var canvas = document.getElementById("draw_surface");
    clear_cursor_regions();
    set_cursor_region({
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
    }, cursor)


    // For resizing left/top, we need the differential between
    // the coverage area and the actual shape area, since moving
    // the shape uses coverage area.
    var move_differential_x = app_context.select_state.selected_object.coverage_area.x - left_pos;
    var move_differential_y = app_context.select_state.selected_object.coverage_area.y - top_pos;

    function update_shape_data(shape, ev) {
        var width_scale = null;
        var height_scale = null;

        var origin = get_canvas_origin();
        var canvas_x = ev.clientX - origin.x;
        var canvas_y = ev.clientY - origin.y;

        if (box_data.select.left) {
            var x_diff = canvas_x - obj_x;
            var new_width = obj_width - x_diff;
            width_scale = new_width / obj_width;
        }
        if (box_data.select.right) {
            var original_right = obj_x + obj_width;
            var x_diff = original_right - canvas_x;
            var new_width = obj_width - x_diff;
            width_scale = new_width / obj_width;
        }
        if (box_data.select.top) {
            var y_diff = canvas_y - obj_y;
            var new_height = obj_height - y_diff;
            height_scale = new_height / obj_height;
        }
        if (box_data.select.bottom) {
            var original_bottom = obj_y + obj_height;
            var y_diff = original_bottom - canvas_y;
            var new_height = obj_height - y_diff;
            height_scale = new_height / obj_height;
        }

        var original_radius;
        if (shape.shape === "circle") {
            original_radius = shape.values.radius;
            // XXX - this should probably allow circles to deform into an oval
            if (height_scale !== null && width_scale !== null) {
                if (height_scale > width_scale) {
                    height_scale = width_scale;
                }
                else {
                    width_scale = height_scale;
                }
            }
        }
        else {
            if (height_scale === null) {
                height_scale = 1.0;
            }
            if (width_scale === null) {
                width_scale = 1.0;
            }
        }

        resize_shape(shape, width_scale, height_scale);

        if (shape.shape === "circle") {
            if (box_data.select.left) {
                move_display_xy(shape,  (original_radius - shape.values.radius) * 2, 0);
            }
            if (box_data.select.top) {
                move_display_xy(shape, 0, (original_radius - shape.values.radius) * 2);
            }

            if (shape.values.radius < 0) {
                shape.values.radius *= -1;
            }
        }
        else {
            if (box_data.select.left) {
                var diff = get_position_differential(shape, ev);
                move_display_xy(shape, diff.dx + move_differential_y, 0);
            }
            if (box_data.select.top) {
                var diff = get_position_differential(shape, ev);
                move_display_xy(shape, 0, diff.dy + move_differential_y);
            }
        }
    }

    function handle_mouse_move(ev) {
        // Keeps dragging up from selecting text in the shape dialog
        document.getSelection().removeAllRanges();
        var movement_proxy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
        set_movement_proxy_display(movement_proxy);
        update_shape_data(movement_proxy, ev);

        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");
        var origin = get_canvas_origin();

        context.clearRect(0, 0, canvas.width, canvas.height);

        _draw_shapes(context, [movement_proxy], origin);
    }

    function handle_mouse_up(ev) {
        var save_obj = JSON.parse(JSON.stringify(app_context.select_state.selected_object));

        update_shape_data(save_obj, ev);
        update_shape_on_artboard(save_obj);

        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        $(window).unbind("mousemove", handle_mouse_move);
        $(window).unbind("mouseup", handle_mouse_up);
    }

    $(window).on("mousemove", { x_offset: x - screen_x, y_offset: y - screen_y}, handle_mouse_move);
    $(window).on("mouseup", { x_offset: x - screen_x, y_offset: y - screen_y}, handle_mouse_up);

    return false;
}

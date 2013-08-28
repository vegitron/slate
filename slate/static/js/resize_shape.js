function start_shape_resize(x, y, box_data) {
    var obj_x = app_context.select_state.selected_object.coverage_area.x;
    var obj_y = app_context.select_state.selected_object.coverage_area.y;
    var obj_width = app_context.select_state.selected_object.coverage_area.width;
    var obj_height = app_context.select_state.selected_object.coverage_area.height;

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

    function update_shape_data(shape, ev) {
        var width_scale = 1.0;
        var height_scale = 1.0;

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

        resize_shape(shape, width_scale, height_scale);

        if (box_data.select.left) {
            var diff = get_position_differential(shape, ev);
            move_display_xy(shape, diff.dx, 0);
        }
        if (box_data.select.top) {
            var diff = get_position_differential(shape, ev);
            move_display_xy(shape, 0, diff.dy);
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

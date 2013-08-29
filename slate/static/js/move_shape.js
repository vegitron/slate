function start_selected_shape_move(x, y) {
    var obj_x = app_context.select_state.selected_object.coverage_area.x;
    var obj_y = app_context.select_state.selected_object.coverage_area.y;

    var origin = Slate.Artboard.get_canvas_origin();

    var screen_x = obj_x + origin.x;
    var screen_y = obj_y + origin.y;

    var movement_proxy;


    function handle_mouse_move(ev) {
        document.getSelection().removeAllRanges();
        if (!movement_proxy) {
            movement_proxy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
            set_movement_proxy_display(movement_proxy);
        }

        var diff = get_position_differential(movement_proxy, ev);

        move_display_xy(movement_proxy, diff.dx, diff.dy);
        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");
        var origin = Slate.Artboard.get_canvas_origin();

        context.clearRect(0, 0, canvas.width, canvas.height);

        Slate.Layer.draw_shapes(context, [movement_proxy], origin);

        Slate.Event.clear_cursor_regions();
        Slate.Event.set_cursor_region({
            x: 0,
            y: 0,
            width: canvas.width,
            height: canvas.height
        }, 'move')
        Slate.Event.clear_mousedown_regions();

    }

    function handle_mouse_up(ev) {
        var save_obj = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
        var diff = get_position_differential(save_obj, ev);

        move_display_xy(save_obj, diff.dx, diff.dy);
        Slate.Drawing.update_shape_on_artboard(save_obj);

        $(window).unbind("mousemove", handle_mouse_move);
        $(window).unbind("mouseup", handle_mouse_up);

        show_selected_object_handles();

        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    $(window).on("mousemove", { x_offset: x - screen_x, y_offset: y - screen_y}, handle_mouse_move);
    $(window).on("mouseup", { x_offset: x - screen_x, y_offset: y - screen_y}, handle_mouse_up);

    return false;
}


function get_position_differential(shape, ev) {
    var origin = Slate.Artboard.get_canvas_origin();
    var new_x = ev.clientX - ev.data.x_offset;
    var new_y = ev.clientY - ev.data.y_offset;

    var old_x = shape.coverage_area.x;
    var old_y = shape.coverage_area.y;

    var dx = new_x - old_x - origin.x;
    var dy = new_y - old_y - origin.y;

    return {
        dx: dx,
        dy: dy
    };
}



Slate.RotateShape = (function ($) {
    "use strict";
    var starting_angle,
        center_x,
        center_y,
        selected_shape,
        text_angle = 0;

    function start_shape_rotate(x, y, shape) {
        var coverage_area = shape.coverage_area,
            obj_x = shape.coverage_area.x,
            obj_y = shape.coverage_area.y,
            origin = Slate.Artboard.get_canvas_origin(),
            screen_x = obj_x + origin.x,
            screen_y = obj_y + origin.y;

        selected_shape = shape;
        center_x = obj_x + (coverage_area.width / 2);
        center_y = obj_y + (coverage_area.height / 2);

        starting_angle = mouse_angle(center_x, center_y, x - origin.x, y - origin.y);

        // Text data doesn't change for rotation, it just has an angle attribute
        // Without tracking that, all rotation starts at 0 degrees, which looks lame.
        if (shape.shape === "text") {
            text_angle = shape.values.angle || 0;
        }

        $(window).on("mousemove", handle_mouse_move);
        $(window).on("mouseup", handle_mouse_up);

        return false;
    }

    function handle_mouse_move(ev) {
        document.getSelection().removeAllRanges();
        var origin = Slate.Artboard.get_canvas_origin(),
            canvas = document.getElementById("draw_surface"),
            context = canvas.getContext("2d"),
            canvas_x = Slate.Artboard.screen_to_canvas_zoom(ev.clientX) - origin.x,
            canvas_y = Slate.Artboard.screen_to_canvas_zoom(ev.clientY) - origin.y,
            new_angle = mouse_angle(center_x, center_y, canvas_x, canvas_y);

        var movement_proxy = JSON.parse(JSON.stringify(selected_shape));
        Slate.Shape.set_movement_proxy_display(movement_proxy);

        Slate.Shape.rotate_shape(movement_proxy, text_angle + starting_angle - new_angle);

        context.clearRect(0, 0, canvas.width, canvas.height);
        Slate.Layer.draw_shapes(context, [movement_proxy], origin);
    }

    function handle_mouse_up(ev) {
        $(window).unbind("mousemove", handle_mouse_move);
        $(window).unbind("mouseup", handle_mouse_up);

        var origin = Slate.Artboard.get_canvas_origin(),
            save_obj = JSON.parse(JSON.stringify(Slate.Select.get_selected_shape())),
            canvas = document.getElementById("draw_surface"),
            context = canvas.getContext("2d"),
            canvas_x = Slate.Artboard.screen_to_canvas_zoom(ev.clientX) - origin.x,
            canvas_y = Slate.Artboard.screen_to_canvas_zoom(ev.clientY) - origin.y,
            new_angle = mouse_angle(center_x, center_y, canvas_x, canvas_y);


        Slate.Shape.rotate_shape(save_obj, text_angle + starting_angle - new_angle);
        Slate.Drawing.update_shape_on_artboard(save_obj);

        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function mouse_angle(cx, cy, mouse_x, mouse_y) {

        // The 300 is arbitrary - it's just to make sure we have a point
        // on the center's x-axis, off to the right
        var p1 = { x: mouse_x, y: mouse_y },
            p2 = { x: cx, y: cy},
            p3 = { x: cx + 300, y: cy },
            angle = AutoShape().angle_between_points(p1, p2, p3);

        // The angle between points always find the interior angle, but
        // we need a full 360 degrees - this makes angles below the x-axis
        // fall into the 180-360 range
        if (mouse_y > center_y) {
            angle = 180 + (180 - angle);
        }

        return angle;

    }

    return {
        start_shape_rotate: start_shape_rotate
    };
})(jQuery);

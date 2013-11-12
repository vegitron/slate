Slate.Drawing = (function ($) {
    "use strict";
    var TMP_TEXT_FONT_FACE = "Verdana";

    var drawing_state = {
        is_drawing: false,
        points: [],
        text_info: {},
        added_shape_ids: {},
        all_shapes: {},
        fill_color: '',
        border_color: '',
        border_width: ''
    };


    function get_event_position(ev) {
        var original_event = ev.originalEvent;

        if (original_event.touches) {
            return {
                'x': original_event.touches[0].pageX,
                'y': original_event.touches[0].pageY
            };
        }

        return {
            'x': original_event.pageX,
            'y': original_event.pageY
        };
    }

    function start_drawing(ev) {
        var position = get_event_position(ev);
        if (Slate.Event.handle_canvas_mousedown_events(position.x, position.y) === false) {
            return;
        }

        drawing_state.is_drawing = true;
        drawing_state.points = [];

        var origin = Slate.Artboard.get_canvas_origin(),
            action_type = $("input[name='board_actions']:checked").val();

        if (action_type === "pan") {
            drawing_state.points.push({
                x: position.x,
                y: position.y,
            });
        } else if (action_type === "select") {
            Slate.Event.clear_cursor_regions();
            Slate.Event.clear_mousedown_regions();
            Slate.Select.find_select_object(position.x - origin.x, position.y - origin.y);
        } else if (action_type === "text") {
            show_text_box(position.x, position.y);
        } else {
            drawing_state.points.push({
                x: position.x - origin.x,
                y: position.y - origin.y,
            });
        }
        ev.preventDefault();
        ev.stopPropagation();
    }

    function live_update_autoshape(ev) {
        var canvas = document.getElementById("draw_surface"),
            context = canvas.getContext("2d"),
            points = drawing_state.points,
            origin = Slate.Artboard.get_canvas_origin(),
            last_point = points[points.length - 1];

        context.save();
        context.beginPath();
        context.moveTo(last_point.x + origin.x, last_point.y + origin.y);
        context.strokeStyle = drawing_state.border_color;
        context.lineWidth = drawing_state.border_width;

        var position = get_event_position(ev);
        context.lineTo(position.x, position.y);
        context.stroke();
        context.restore();

        points.push({
            x: position.x - origin.x,
            y: position.y - origin.y
        });
    }

    function live_update_rectangle(ev) {
        var canvas = document.getElementById("draw_surface"),
            context = canvas.getContext("2d"),
            origin = Slate.Artboard.get_canvas_origin(),

            points = drawing_state.points,
            last_point = points[points.length - 1],
            x1 = last_point.x,
            y1 = last_point.y,

            position = get_event_position(ev),
            x2 = position.x - origin.x,
            y2 = position.y - origin.y,

            border_width = drawing_state.border_width,
            border_color = drawing_state.border_color,
            fill_color = drawing_state.fill_color;

        context.clearRect(0, 0, canvas.width, canvas.height);

        draw_polygon(context, Slate.Artboard.get_canvas_origin(), border_width, border_color, fill_color,
            [
                { x: x1, y: y1 },
                { x: x1, y: y2 },
                { x: x2, y: y2 },
                { x: x2, y: y1 },
                { x: x1, y: y1 }
            ]);
    }

    function update_display_origin(x, y) {
        var canvas = document.getElementById("artboard"),
            context = canvas.getContext("2d"),

            last_origin = Slate.Artboard.get_canvas_origin(),
            origin_x = last_origin.x,
            origin_y = last_origin.y;

        Slate.Artboard.set_canvas_origin(x, y);

        // XXX - drop these constants, fill in the image w/ image data, invalidate
        // only the areas that actually need re-drawing
        Slate.Layer.invalidate_rectangle({
            x: -1 * origin_x - 10,
            y: -1 * origin_y - 10,
            width: canvas.width + 20,
            height: canvas.height + 20
        });

        Slate.Layer.redraw_regions();

    /*
        var image_data = context.getImageData(0, 0, canvas.width, canvas.height);

        context.putImageData(image_data, image_dest_x, image_dest_y);
    */
    }

    function live_update_panning(ev) {
        var first_point = drawing_state.points[0],

            position = get_event_position(ev),
            d_x = position.x - first_point.x,
            d_y = position.y - first_point.y,

            origin = Slate.Artboard.get_canvas_origin(),

            new_origin_x = origin.x + d_x,
            new_origin_y = origin.y + d_y;

        update_display_origin(new_origin_x, new_origin_y);

        drawing_state.points[0] = {
            x: position.x,
            y: position.y,
        };
    }

    function live_update_drawing(ev) {
        var position = get_event_position(ev);
        Slate.Event.handle_canvas_cursor_events(position.x, position.y);

        if (!drawing_state.is_drawing) {
            return;
        }

        var action_type = $("input[name='board_actions']:checked").val();


        if (action_type === "autoshape") {
            live_update_autoshape(ev);
        } else if (action_type === "rectangle") {
            live_update_rectangle(ev);
        } else if (action_type === "pan") {
            live_update_panning(ev);
        }

        ev.preventDefault();
        ev.stopPropagation();
    }

    function finish_drawing_autoshape(ev) {
        // need to send autoshape coordinates that aren't offset by the origin - wacky
        // things happen when the canvas is in the negative area
        var autoshape_points = [],
            origin = Slate.Artboard.get_canvas_origin(),
            i;
        for (i = 0; i < drawing_state.points.length; i++) {
            autoshape_points.push({
                x: drawing_state.points[i].x + origin.x,
                y: drawing_state.points[i].y + origin.y
            });
        }

        var autoshape = AutoShape().find_shape(autoshape_points);

        // move things back to the origin offset...
        var shape_type = autoshape.best;
        var shape_values = autoshape.full[autoshape.best];

        if (shape_type === "circle") {
            shape_values.cx -= origin.x;
            shape_values.cy -= origin.y;
        } else if (shape_type === "bezier") {
            shape_values = { points: drawing_state.points };
        } else if (shape_type === "line") {
            for (var i = 0; i < shape_values.points.length; i++) {
                shape_values.points[i].x -= origin.x;
                shape_values.points[i].y -= origin.y;
            }
        } else if (shape_type === "polygon") {
            // The last element in this array is a reference to the first, so don't
            // offset it twice
            for (var i = 0; i < shape_values.points.length-1; i++) {
                shape_values.points[i].x -= origin.x;
                shape_values.points[i].y -= origin.y;
            }
        }


        if (shape_type === "line" || shape_type === "bezier") {
            shape_values.border_width = drawing_state.border_width;
            shape_values.border_color = drawing_state.border_color;
        } else {
            shape_values.border_width = drawing_state.border_width;
            shape_values.border_color = drawing_state.border_color;
            shape_values.fill_color = drawing_state.fill_color;
        }

        add_shape_to_artboard({
            layer: Slate.Layer.get_active_layer(),
            shape: shape_type,
            values: shape_values
        });
    }

    function finish_drawing_rectangle(ev) {
        var points = drawing_state.points;
        var origin = Slate.Artboard.get_canvas_origin();

        var last_point = points[points.length - 1];
        var x1 = last_point.x;
        var y1 = last_point.y;

        var position = get_event_position(ev);
        var x2 = position.x - origin.x;
        var y2 = position.y - origin.y;

        var shape_type = 'polygon';
        var shape_values = { points: [
                { x: x1, y: y1 },
                { x: x1, y: y2 },
                { x: x2, y: y2 },
                { x: x2, y: y1 },
                { x: x1, y: y1 }
            ] };


        shape_values.border_width = drawing_state.border_width;
        shape_values.border_color = drawing_state.border_color;
        shape_values.fill_color = drawing_state.fill_color;

        add_shape_to_artboard({
            layer: Slate.Layer.get_active_layer(),
            shape: shape_type,
            values: shape_values
        });
    }

    function square(x) { return x * x; }

    function finish_panning(ev) {
        live_update_panning(ev);

        // XXX - maybe do something here w/ the drag speed,
        // and deccelarate instead of just stopping?
    }

    function text_input_change(ev) {
        var text_area = $("#input_text_area");
        var size = Slate.Shape.Text.get_text_size({
            text: text_area.val(),
            font_size: drawing_state.text_info.font_size,
            font_face: drawing_state.text_info.font_face
        });

        var font_size = drawing_state.text_info.font_size;
        text_area.width(size.width + font_size);
        text_area.height(size.height + font_size * 1.5);
    }

    function text_input_blur(ev) {
        $("#input_text_area").hide();
        add_shape_to_artboard({
            layer: Slate.Layer.get_active_layer(),
            shape: 'text',
            values: {
                text: $("#input_text_area").val(),
                font_face: drawing_state.text_info.font_face,
                font_size: drawing_state.text_info.font_size,
                color: drawing_state.text_info.color,
                x: drawing_state.text_info.x,
                y: drawing_state.text_info.y
            }
        });

        drawing_state.text_info.open_textarea = false;
    }

    function show_text_box(x, y) {
        var text_area = $("#input_text_area");

        if (!text_area.length) {
            text_area = $("<textarea id='input_text_area'></textarea>");
            text_area.css("background-color", "rgba(0, 0, 0, 0)");
            text_area.css("position", "absolute");
            text_area.css("display", "none");
            text_area.css("resize", "none");
            text_area.css("line-height", "120%");
            $("body").append(text_area);

            text_area.keydown(text_input_change);
            text_area.keyup(text_input_change);
            text_area.blur(text_input_blur);
        }

        if (drawing_state.text_info.open_textarea) {
            text_input_blur();
        }

        var matches = text_area.css("border").match(/([0-9]+)px/);
        var border_width = 0;
        if (matches) {
            border_width = +matches[1];
        }

        var offset = border_width;

        var padding = text_area.css("padding");
        if (padding) {
            offset += parseInt(padding);
        }

        var origin = Slate.Artboard.get_canvas_origin();
        drawing_state.text_info.x = x + offset - origin.x;
        drawing_state.text_info.y = y + offset - origin.y;
        drawing_state.text_info.open_textarea = true;
        drawing_state.text_info.font_face = TMP_TEXT_FONT_FACE;

        text_area.val("");
        text_area.css("left", x+"px");
        text_area.css("top", y+"px");
        text_area.css("font-family", TMP_TEXT_FONT_FACE);
        text_area.css("font-size", drawing_state.text_info.font_size);
        text_area.css("color", drawing_state.text_info.color);

        // To set the initial size
        text_input_change();

        text_area.css("display", "inline");
        text_area.focus();
    }

    function finish_drawing(ev) {
        if (drawing_state.is_drawing) {
            drawing_state.is_drawing = false;

            var canvas = document.getElementById("draw_surface");
            var context = canvas.getContext("2d");
            context.clearRect(0, 0, canvas.width, canvas.height);

            var action_type = $("input[name='board_actions']:checked").val();

            var shape_type, shape_values, add_shape;

            if (action_type === "autoshape") {
                finish_drawing_autoshape(ev);
            } else if (action_type === "rectangle") {
                finish_drawing_rectangle(ev);
            } else if (action_type === "pan") {
                finish_panning(ev);
            }

            drawing_state.points = [];

            ev.preventDefault();
            ev.stopPropagation();
        }

    }

    function add_drawing_events() {
        $("#draw_surface").on("mousedown", start_drawing);
        $(window).on("mousemove", live_update_drawing);
        $(window).on("mouseup", finish_drawing);
        $("#draw_surface").on("touchstart", start_drawing);
        $(window).on("touchmove", live_update_drawing);
        $(window).on("touchend", finish_drawing);
    }

    function add_shape_from_server(info) {
        var server_id = info.id;

        // So we can add the shape from the response to the POST,
        // and not worry about the periodic update
        if (drawing_state.added_shape_ids[server_id]) {
            return;
        }
        drawing_state.added_shape_ids[server_id] = true;
        drawing_state.all_shapes[server_id] = info;

        info.shape_definition.id = server_id;
        info.shape_definition.z_index = info.z_index;

        info.shape_definition.coverage_area = Slate.Shape.get_invalid_area(info.shape_definition);

        Slate.Layer.add_shape_to_layer(info.layer_id, info.shape_definition);

        Slate.Layer.invalidate_rectangle(info.shape_definition.coverage_area);

    }

    function update_shape_from_server(info) {
        var server_id = info.id;

        var original_shape = drawing_state.all_shapes[info.id];
        var original_invalid_area = Slate.Shape.get_invalid_area(original_shape.shape_definition);

        var new_invalid_area = Slate.Shape.get_invalid_area(info.shape_definition);
        info.shape_definition.coverage_area = new_invalid_area;

        // Do this in pieces, so the references all get updated
        // XXX - If z-index or the layer are changed...
        var reference_values = drawing_state.all_shapes[server_id].shape_definition.values;
        for (var key in info.shape_definition.values) {
            if (info.shape_definition.values.hasOwnProperty(key)) {
                reference_values[key] = info.shape_definition.values[key];
            }
        }

        drawing_state.all_shapes[server_id].shape_definition.coverage_area = new_invalid_area;

        Slate.Layer.invalidate_rectangle(original_invalid_area);
        Slate.Layer.invalidate_rectangle(new_invalid_area);

        Slate.Select.show_selected_object_handles();
        var selected_shape = Slate.Select.get_selected_shape();
        if (selected_shape) {
            Slate.Attributes.load_attributes_for_shape(selected_shape);
        }
    }

    function update_shape_success(info) {
        update_shape_from_server(info);

        Slate.Layer.draw_layer_previews();
        Slate.Layer.redraw_regions();
    }

    function add_shape_success(info) {
        add_shape_from_server(info);

        Slate.Layer.draw_layer_previews();
        Slate.Layer.redraw_regions();
    }

    function update_shape_on_artboard(info) {
        var save_data = {
            type: info.shape,
            layer_id: info.layer,
            z_index: info.z_index,
            shape_definition: info
        };

        var csrf_value = $("input[name='csrfmiddlewaretoken']")[0].value;
        var post_args = {
            type: "PUT",
            headers: {
                "X-CSRFToken": csrf_value
            },

            data: JSON.stringify(save_data),
            success: update_shape_success
        };

        $.ajax(slate_home+'/rest/shape/'+artboard_url_token+'/'+info.id, post_args);

    }

    function add_shape_to_artboard(info) {
        var save_data = {
            type: info.shape,
            layer_id: info.layer,
            z_index: Slate.Layer.get_shape_count_for_layer(info.layer),
            shape_definition: info
        };

        var csrf_value = $("input[name='csrfmiddlewaretoken']")[0].value;
        var post_args = {
            type: "POST",
            headers: {
                "X-CSRFToken": csrf_value
            },

            data: JSON.stringify(save_data),
            success: add_shape_success
        };

        $.ajax(slate_home+'/rest/shape/'+artboard_url_token, post_args);

    }

    function value_scaled_by_zoom(val) {
        return val * Slate.Artboard.get_zoom_scale();
    }

    function draw_polygon(context, origin, border_width, border_color, fill_color, points) {
        context.save();
        context.beginPath();

        context.moveTo(value_scaled_by_zoom(points[0].x + origin.x), value_scaled_by_zoom(points[0].y + origin.y));
        for (var i = 0; i < points.length-1; i++) {
            context.lineTo(value_scaled_by_zoom(points[i+1].x + origin.x), value_scaled_by_zoom(points[i+1].y + origin.y));
        }

        context.lineWidth = value_scaled_by_zoom(border_width);
        context.lineCap = 'round';
        context.strokeStyle= border_color;

        if (fill_color !== null) {
            context.closePath();
            context.fillStyle = fill_color;
            context.fill();
        }
        context.stroke();
        context.restore();

    }

    function draw_line(context, origin, border_width, border_color, points) {
        context.beginPath();
        context.moveTo(value_scaled_by_zoom(points[0].x + origin.x), value_scaled_by_zoom(points[0].y + origin.y));
        context.strokeStyle = border_color;
        context.lineWidth = value_scaled_by_zoom(border_width);
        context.lineTo(value_scaled_by_zoom(points[1].x + origin.x), value_scaled_by_zoom(points[1].y + origin.y));
        context.stroke();
    }

    function draw_text(context, origin, color, info) {
        context.save();
        context.font = info.font_size+"px "+info.font_face;
        context.fillStyle = color;

        var rotation_angle = info.angle || 0;

        // We need to get the size of the text here, so we can rotate from the center of the text,
        // rather than the upper left hand corner
        var text_size = Slate.Shape.Text.get_text_size(info);
        var x_translate_offset = text_size.width / 2;
        var y_translate_offset = text_size.height / 2;

        context.translate(info.x + x_translate_offset + origin.x, info.y + y_translate_offset + origin.y);

        if (rotation_angle) {
            context.rotate(rotation_angle * Math.PI / 180);
        }

        // fillText doesn't support multiple lines :(
        var text = info.reflowed_text || info.text;
        var lines = text.split("\n");
        var x = info.x + origin.x;
        for (var i = 0; i < lines.length; i++) {
            // +1 because text is vertically aligned so the y position
            // is the bottom of the text.

            // Working with a line-height of 120%.  The first line though isn't offset by the 20%, so that needs to be taken off.
            var y = (1.2 * info.font_size * (i +1)) - info.font_size * 0.2;
            context.fillText(lines[i],  -1 * x_translate_offset, y - y_translate_offset);
        }
        context.restore();
    }

    function draw_circle(context, origin, border_width, border_color, fill_color, cx, cy, radius) {
        context.save();
        context.beginPath();
        context.arc(value_scaled_by_zoom(cx + origin.x), value_scaled_by_zoom(cy + origin.y), value_scaled_by_zoom(radius), 0, 2 * Math.PI, false);
        context.lineWidth = value_scaled_by_zoom(border_width);
        context.strokeStyle = border_color;
        context.stroke();
        if (fill_color !== null) {
            context.fillStyle = fill_color;
            context.fill();
        }
        context.restore();
    }

    // Obviously not really bezier yet :(
    function draw_bezier(context, origin, border_width, border_color, points) {
        draw_polygon(context, origin, border_width, border_color, null, points);
    }

    function set_fill_color(color) {
        drawing_state.fill_color = color;
    }

    function set_border_color(color) {
        drawing_state.border_color = color;
    }

    function set_border_width(width) {
        drawing_state.border_width = width;
    }

    function set_text_color(color) {
        drawing_state.text_info.color = color;
    }

    function set_text_size(size) {
        drawing_state.text_info.font_size = size;
    }

    function get_fill_color() {
        return drawing_state.fill_color;
    }

    function get_border_color() {
        return drawing_state.border_color;
    }

    function get_border_width() {
        return drawing_state.border_width;
    }

    function get_text_color() {
        return drawing_state.text_info.color;
    }

    function get_text_size() {
        return drawing_state.text_info.size;
    }

    return {
        set_fill_color: set_fill_color,
        set_border_color: set_border_color,
        set_border_width: set_border_width,
        set_text_color: set_text_color,
        set_text_size: set_text_size,
        get_fill_color: get_fill_color,
        get_border_color: get_border_color,
        get_border_width: get_border_width,
        get_text_color: get_text_color,
        get_text_size: get_text_size,
        add_drawing_events: add_drawing_events,
        add_shape_from_server: add_shape_from_server,
        update_shape_on_artboard: update_shape_on_artboard,
        update_shape_from_server: update_shape_from_server,
        draw_text: draw_text,
        draw_circle: draw_circle,
        draw_polygon: draw_polygon,
        draw_line: draw_line,
        draw_bezier: draw_bezier
    };

})(jQuery);

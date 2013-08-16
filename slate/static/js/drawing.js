/*
    XXX - make these user choices!
*/

TMP_TEXT_FONT_SIZE = 40;
TMP_TEXT_FONT_FACE = "Verdana";

app_context.drawing_state = {
    is_drawing: false,
    origin_x: 0,
    origin_y: 0,
    points: [],
    text_info: {}
}

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
    app_context.drawing_state.is_drawing = true;
    app_context.drawing_state.points = [];
    var origin = get_canvas_origin();

    var action_type = $("input[name='board_actions']:checked").val();

    var position = get_event_position(ev);

    if (action_type === "pan") {
        app_context.drawing_state.points.push({
            x: position.x,
            y: position.y,
        });
    }
    else if (action_type === "select") {
        var shape = find_select_object(position.x - origin.x, position.y - origin.y);
        select_shape(shape);
    }
    else if (action_type === "text") {
        show_text_box(position.x, position.y);
    }
    else {
        app_context.drawing_state.points.push({
            x: position.x - origin.x,
            y: position.y - origin.y,
        });
    }
    event.preventDefault();
    event.stopPropagation();
}

function _live_update_autoshape(ev) {
    var canvas = document.getElementById("draw_surface");
    var context = canvas.getContext("2d");

    var points = app_context.drawing_state.points;
    var origin = get_canvas_origin();
    var last_point = points[points.length - 1];

    context.save();
    context.beginPath();
    context.moveTo(last_point.x + origin.x, last_point.y + origin.y);
    context.strokeStyle = 'black';
    context.lineWidth = 4;

    var position = get_event_position(ev);
    context.lineTo(position.x, position.y);
    context.stroke();
    context.restore();

    points.push({
        x: position.x - origin.x,
        y: position.y - origin.y
    });
}

function _live_update_rectangle(ev) {
    var canvas = document.getElementById("draw_surface");
    var context = canvas.getContext("2d");
    var origin = get_canvas_origin();

    context.clearRect(0, 0, canvas.width, canvas.height);

    var points = app_context.drawing_state.points;
    var last_point = points[points.length - 1];
    var x1 = last_point.x;
    var y1 = last_point.y;

    var position = get_event_position(ev);
    var x2 = position.x - origin.x;
    var y2 = position.y - origin.y;

    draw_polygon(context, get_canvas_origin(), 'black', [
            { x: x1, y: y1 },
            { x: x1, y: y2 },
            { x: x2, y: y2 },
            { x: x2, y: y1 },
            { x: x1, y: y1 }
        ]
    );
}

function update_display_origin(x, y) {
    var canvas = document.getElementById("artboard");
    var context = canvas.getContext("2d");

    var origin_x = app_context.drawing_state.origin_x;
    var origin_y = app_context.drawing_state.origin_y;

    app_context.drawing_state.origin_x = x;
    app_context.drawing_state.origin_y = y;

    // XXX - drop these constants, fill in the image w/ image data, invalidate
    // only the areas that actually need re-drawing
    invalidate_rectangle({
        x: -1 * origin_x - 10,
        y: -1 * origin_y - 10,
        width: canvas.width + 20,
        height: canvas.height + 20
    });

    redraw_regions();

/*
    var image_data = context.getImageData(0, 0, canvas.width, canvas.height);

    context.putImageData(image_data, image_dest_x, image_dest_y);
*/
}

function _live_update_panning(ev) {
    var first_point = app_context.drawing_state.points[0];

    var position = get_event_position(ev);
    var d_x = position.x - first_point.x;
    var d_y = position.y - first_point.y;

    var new_origin_x = app_context.drawing_state.origin_x + d_x;
    var new_origin_y = app_context.drawing_state.origin_y + d_y;

    update_display_origin(new_origin_x, new_origin_y);

    app_context.drawing_state.points[0] = {
        x: position.x,
        y: position.y,
    };
}

function live_update_drawing(ev) {
    if (!app_context.drawing_state.is_drawing) {
        return;
    }

    var action_type = $("input[name='board_actions']:checked").val();


    if (action_type === "autoshape") {
        _live_update_autoshape(ev);
    }

    else if (action_type === "rectangle") {
        _live_update_rectangle(ev);
    }

    else if (action_type === "pan") {
        _live_update_panning(ev);
    }

    event.preventDefault();
    event.stopPropagation();
}

function _finish_drawing_autoshape(ev) {
    // need to send autoshape coordinates that aren't offset by the origin - wacky
    // things happen when the canvas is in the negative area
    var autoshape_points = [];
    var origin = get_canvas_origin();
    for (var i = 0; i < app_context.drawing_state.points.length; i++) {
        autoshape_points.push({
            x: app_context.drawing_state.points[i].x + origin.x,
            y: app_context.drawing_state.points[i].y + origin.y
        });
    }

    var autoshape = AutoShape().find_shape(autoshape_points);

    // move things back to the origin offset...
    var shape_type = autoshape.best;
    var shape_values = autoshape.full[autoshape.best];

    if (shape_type === "circle") {
        shape_values.cx -= origin.x;
        shape_values.cy -= origin.y;
    }
    else if (shape_type === "bezier") {
        shape_values = { points: app_context.drawing_state.points };
    }
    else if (shape_type === "line") {
        for (var i = 0; i < shape_values.points.length; i++) {
            shape_values.points[i].x -= origin.x;
            shape_values.points[i].y -= origin.y;
        }
    }
    else if (shape_type === "polygon") {
        // The last element in this array is a reference to the first, so don't
        // offset it twice
        for (var i = 0; i < shape_values.points.length-1; i++) {
            shape_values.points[i].x -= origin.x;
            shape_values.points[i].y -= origin.y;
        }
    }

    add_shape_to_artboard({
        layer: get_active_layer(),
        shape: shape_type,
        values: shape_values
    });
}

function _finish_drawing_rectangle(ev) {
    var points = app_context.drawing_state.points;
    var origin = get_canvas_origin();

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

    add_shape_to_artboard({
        layer: get_active_layer(),
        shape: shape_type,
        values: shape_values
    });
}

function square(x) { return x * x; }

function _finish_panning(ev) {
    _live_update_panning(ev);

    // XXX - maybe do something here w/ the drag speed,
    // and deccelarate instead of just stopping?
}

function text_input_change(ev) {
    var text_area = $("#input_text_area");
    var size = get_text_size({
        text: text_area.val(),
        font_size: app_context.drawing_state.text_info.font_size,
        font_family: app_context.drawing_state.text_info.font_family
    });

    text_area.width(size.width + TMP_TEXT_FONT_SIZE);
    text_area.height(size.height + TMP_TEXT_FONT_SIZE * 1.5);
}

function text_input_blur(ev) {
    $("#input_text_area").hide();
    add_shape_to_artboard({
        layer: get_active_layer(),
        shape: 'text',
        values: {
            text: $("#input_text_area").val(),
            font_face: app_context.drawing_state.text_info.font_family,
            font_size: app_context.drawing_state.text_info.font_size,
            x: app_context.drawing_state.text_info.x,
            y: app_context.drawing_state.text_info.y
        }
    });

    app_context.drawing_state.text_info.open_textarea = false;
}

function show_text_box(x, y) {
    var text_area = $("#input_text_area");

    if (!text_area.length) {
        text_area = $("<textarea id='input_text_area'></textarea>");
        text_area.css("background-color", "rgba(0, 0, 0, 0)");
        text_area.css("position", "absolute");
        text_area.css("display", "none");
        text_area.css("resize", "none");
        $("body").append(text_area);

        text_area.keydown(text_input_change);
        text_area.keyup(text_input_change);
        text_area.blur(text_input_blur);
    }

    if (app_context.drawing_state.text_info.open_textarea) {
        text_input_blur();
    }

    var matches = text_area.css("border").match(/([0-9]+)px/);
    var border_width = +matches[1];

    var offset = parseInt(text_area.css("padding")) + border_width;
    app_context.drawing_state.text_info = {
        x: x+offset,
        y: y+offset,
        font_size: TMP_TEXT_FONT_SIZE,
        font_family: TMP_TEXT_FONT_FACE,
        open_textarea: true
    };

    text_area.val("");
    text_area.css("left", x+"px");
    text_area.css("top", y+"px");
    text_area.css("font-family", TMP_TEXT_FONT_FACE);
    text_area.css("font-size", TMP_TEXT_FONT_SIZE);

    // To set the initial size
    text_input_change();

    text_area.css("display", "inline");
    text_area.focus();
}

function finish_drawing(ev) {
    if (app_context.drawing_state.is_drawing) {
        app_context.drawing_state.is_drawing = false;

        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        var action_type = $("input[name='board_actions']:checked").val();

        var shape_type, shape_values, add_shape;

        if (action_type === "autoshape") {
            _finish_drawing_autoshape(ev);
            draw_layer_previews();
        }
        else if (action_type === "rectangle") {
            _finish_drawing_rectangle(ev);
            draw_layer_previews();
        }
        else if (action_type === "pan") {
            _finish_panning(ev);
            draw_layer_previews();
        }

        app_context.drawing_state.points = [];

        event.preventDefault();
        event.stopPropagation();
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

function add_shape_to_artboard(info) {
    var canvas = document.getElementById("artboard");
    var context = canvas.getContext("2d");

    var shape = info.shape;
    var values = info.values;

    info.coverage_area = get_invalid_area(info);
    info.z_index = app_context.layer_data.layer_shapes[info.layer].length;

    app_context.layer_data.layer_shapes[info.layer].push(info);

    invalidate_rectangle(info.coverage_area);

    redraw_regions();
}

function get_canvas_origin() {
    return {
        x: app_context.drawing_state.origin_x,
        y: app_context.drawing_state.origin_y,
    };
}

function draw_polygon(context, origin, color,  points) {
    for (var i = 0; i < points.length-1; i++) {
        context.beginPath();
        context.moveTo(points[i].x + origin.x, points[i].y + origin.y);
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.strokeStyle= color;
        context.lineTo(points[i+1].x + origin.x, points[i+1].y + origin.y);
        context.stroke();
    }
}

function draw_line(context, origin, color, points) {
    context.beginPath();
    context.moveTo(points[0].x + origin.x, points[0].y + origin.y);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.lineTo(points[1].x + origin.x, points[1].y + origin.y);
    context.stroke();
}

function draw_text(context, origin, color, info) {
    context.save();
    context.font = info.font_size+"px "+info.font_face;
    context.fillStyle = color;

    // fillText doesn't support multiple lines :(
    var lines = info.text.split("\n");
    var x = info.x + origin.x;
    for (var i = 0; i < lines.length; i++) {
        // +1 because text is vertically aligned so the y position
        // is the bottom of the text.
        var y = info.y + origin.y + (info.font_size * (i +1));
        context.fillText(lines[i], x, y);
    }
    context.restore();
}

function draw_circle(context, origin, color, cx, cy, radius) {
    context.beginPath();
    context.arc(cx + origin.x, cy + origin.y, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.stroke();
}

// Obviously not really bezier yet :(
function draw_bezier(context, origin, color, points) {
    draw_polygon(context, origin, color, points);
}



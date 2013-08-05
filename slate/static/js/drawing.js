app_context.drawing_state = {
    is_drawing: false,
    origin_x: 0,
    origin_y: 0,
    points: []
}

function start_drawing(ev) {
    app_context.drawing_state.is_drawing = true;
    app_context.drawing_state.points = [];
    var origin = get_canvas_origin();

    var action_type = $("input[name='board_actions']:checked").val();

    if (action_type === "pan") {
        app_context.drawing_state.points.push({
            x: ev.clientX,
            y: ev.clientY,
        });
    }
    else {
        app_context.drawing_state.points.push({
            x: ev.clientX - origin.x,
            y: ev.clientY - origin.y,
        });
    }
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
    context.lineTo(ev.clientX, ev.clientY);
    context.stroke();
    context.restore();

    points.push({
        x: ev.clientX - origin.x,
        y: ev.clientY - origin.y
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
    var x2 = ev.clientX - origin.x;
    var y2 = ev.clientY - origin.y;

    draw_polygon(context, 'black', [
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
    var d_x = ev.clientX - first_point.x;
    var d_y = ev.clientY - first_point.y;

    var new_origin_x = app_context.drawing_state.origin_x + d_x;
    var new_origin_y = app_context.drawing_state.origin_y + d_y;

    update_display_origin(new_origin_x, new_origin_y);

    app_context.drawing_state.points[0] = {
        x: ev.clientX,
        y: ev.clientY,
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
    var x2 = ev.clientX - origin.x;
    var y2 = ev.clientY - origin.y;

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
        }
        else if (action_type === "rectangle") {
            _finish_drawing_rectangle(ev);
        }
        else if (action_type === "pan") {
            _finish_panning(ev);
        }

        app_context.drawing_state.points = [];
    }
}

function add_drawing_events() {
    $("#draw_surface").on("mousedown", start_drawing);
    $(window).on("mousemove", live_update_drawing);
    $(window).on("mouseup", finish_drawing);
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

function draw_polygon(context, color,  points) {
    var origin = get_canvas_origin();
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

function draw_line(context, color, points) {
    var origin = get_canvas_origin();
    context.beginPath();
    context.moveTo(points[0].x + origin.x, points[0].y + origin.y);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.lineTo(points[1].x + origin.x, points[1].y + origin.y);
    context.stroke();
}


function draw_circle(context, color, cx, cy, radius) {
    var origin = get_canvas_origin();
    context.beginPath();
    context.arc(cx + origin.x, cy + origin.y, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.stroke();
}

// Obviously not really bezier yet :(
function draw_bezier(context, color, points) {
    draw_polygon(context, color, points);
}



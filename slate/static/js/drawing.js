app_context.drawing_state = {
    is_drawing: false,
    points: []
}

function start_drawing(ev) {
    app_context.drawing_state.is_drawing = true;
    app_context.drawing_state.points = [];

    app_context.drawing_state.points.push({
        x: ev.clientX,
        y: ev.clientY,
    });
}

function live_update_drawing(ev) {
    if (!app_context.drawing_state.is_drawing) {
        return;
    }

    var action_type = $("input[name='board_actions']:checked").val();

    var canvas = document.getElementById("draw_surface");
    var context = canvas.getContext("2d");

    if (action_type === "autoshape") {
        var points = app_context.drawing_state.points;
        var last_point = points[points.length - 1];

        context.save();
        context.beginPath();
        context.moveTo(last_point.x, last_point.y);
        context.strokeStyle = 'black';
        context.lineWidth = 4;
        context.lineTo(ev.clientX, ev.clientY);
        context.stroke();
        context.restore();

        points.push({
            x: ev.clientX,
            y: ev.clientY
        });
    }

    else if (action_type === "rectangle") {
        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");

        context.clearRect(0, 0, canvas.width, canvas.height);

        var points = app_context.drawing_state.points;
        var last_point = points[points.length - 1];
        var x1 = last_point.x;
        var y1 = last_point.y;
        var x2 = ev.clientX;
        var y2 = ev.clientY;

        draw_polygon(context, 'black', [
                { x: x1, y: y1 },
                { x: x1, y: y2 },
                { x: x2, y: y2 },
                { x: x2, y: y1 },
                { x: x1, y: y1 }
            ]
        );
    }
}

function finish_drawing(ev) {
    if (app_context.drawing_state.is_drawing) {
        app_context.drawing_state.is_drawing = false;

        var canvas = document.getElementById("draw_surface");
        var context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);

        var action_type = $("input[name='board_actions']:checked").val();

        var shape_type, shape_values;

        if (action_type === "autoshape") {
            var autoshape = AutoShape().find_shape(app_context.drawing_state.points);
            shape_type = autoshape.best;
            shape_values = autoshape.full[autoshape.best];
            if (shape_type === "bezier") {
                shape_values = { points: app_context.drawing_state.points };
            }
        }
        else if (action_type === "rectangle") {
            var draw_canvas = document.getElementById("draw_surface");
            var draw_context = canvas.getContext("2d");

            draw_context.clearRect(0, 0, canvas.width, canvas.height);

            var points = app_context.drawing_state.points;
            var last_point = points[points.length - 1];
            var x1 = last_point.x;
            var y1 = last_point.y;
            var x2 = ev.clientX;
            var y2 = ev.clientY;

            shape_type = 'polygon';
            shape_values = { points: [
                    { x: x1, y: y1 },
                    { x: x1, y: y2 },
                    { x: x2, y: y2 },
                    { x: x2, y: y1 },
                    { x: x1, y: y1 }
                ] };
        }

        add_shape_to_artboard({
            layer: get_active_layer(),
            shape: shape_type,
            values: shape_values
        });

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

    if (shape === 'circle') {
        draw_circle(context, 'black', values.cx, values.cy, values.radius);
    }
    else if (shape === 'polygon') {
        draw_polygon(context, 'black', values.points);
    }
    else if (shape === 'line') {
        draw_line(context, 'black', values.points);
    }
    else if (shape === 'bezier') {
        draw_bezier(context, 'black', values.points);
    }


}

function draw_polygon(context, color,  points) {
    for (var i = 0; i < points.length-1; i++) {
        context.beginPath();
        context.moveTo(points[i].x, points[i].y);
        context.lineWidth = 5;
        context.lineCap = 'round';
        context.strokeStyle= color;
        context.lineTo(points[i+1].x, points[i+1].y);
        context.stroke();
    }
}

function draw_line(context, color, points) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.lineTo(points[1].x, points[1].y);
    context.stroke();
}


function draw_circle(context, color, cx, cy, radius) {
    context.beginPath();
    context.arc(cx, cy, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.stroke();
}

// Obviously not really bezier yet :(
function draw_bezier(context, color, points) {
    draw_polygon(context, color, points);
}



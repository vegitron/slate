app_context.select_state = {
    selected_object: null
};

function find_select_object(x, y) {
    // Find the thing in the "highest" layer - lowest id, with the highest
    // z-index

    var intersecting_shapes = find_intersecting_shapes({ x: x, y: y, width: 1, height: 1 });

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


    var last_selected = app_context.select_state.selected_object;

    if (last_selected) {
        invalidate_rectangle(last_selected.coverage_area);
        last_selected.selected_shape = false;
    }

    if (selected_shape) {
        invalidate_rectangle(selected_shape.coverage_area);
        selected_shape.selected_shape = true;
        app_context.select_state.selected_object = selected_shape;
    }
    else {
        app_context.select_state.selected_object = null;
    }

    redraw_regions();
}

function show_selected_object_handles() {
    if (!app_context.select_state.selected_object) {
        return;
    }

    var corners = get_selection_highlight_corners(app_context.select_state.selected_object);
    var canvas = document.getElementById("artboard");
    var context = canvas.getContext("2d");

    var origin = get_canvas_origin();

    context.save();
    context.beginPath();
    context.moveTo(corners[0].x + origin.x, corners[0].y + origin.y);
    for (var i = 1; i < corners.length; i++) {
        context.lineTo(corners[i].x + origin.x, corners[i].y + origin.y);
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

    var SELECT_SQUARE_SIZE = 6;
    for (var i = 1; i < corners.length; i++) {
        context.beginPath();
        context.rect(corners[i].x - SELECT_SQUARE_SIZE / 2, corners[i].y - SELECT_SQUARE_SIZE / 2, SELECT_SQUARE_SIZE, SELECT_SQUARE_SIZE);
        context.closePath();
        context.stroke();
        context.fill();

        context.beginPath();
        var mid_x = (corners[i].x + corners[i - 1].x) / 2;
        var mid_y = (corners[i].y + corners[i - 1].y) / 2;
        context.rect(mid_x - SELECT_SQUARE_SIZE / 2, mid_y - SELECT_SQUARE_SIZE / 2, SELECT_SQUARE_SIZE, SELECT_SQUARE_SIZE);
        context.closePath();

        context.stroke();
        context.fill();

    }
    context.restore();
}

function select_shape(shape) {
}




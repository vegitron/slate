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

function select_shape(shape) {
}




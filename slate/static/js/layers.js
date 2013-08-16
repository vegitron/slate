app_context.layer_data = {
    layers: [],
    layer_shapes: [],
    selected_layer: null,
    next_layer_id: 1
};

app_context.redraw_info = {
    areas: [],
    shapes: []
};

function show_hide_layer(ev) {
    var target = ev.target;
    ev.stopPropagation();

    var layer_id = target.value;
    var checked = target.checked;

    if (checked) {
        app_context.layer_data.layers[layer_id].visible = true;
    }
    else {
        app_context.layer_data.layers[layer_id].visible = false;
    }

    for (var i = 0; i < app_context.layer_data.layer_shapes[layer_id].length; i++) {
        invalidate_rectangle(app_context.layer_data.layer_shapes[layer_id][i].coverage_area);
    }

    redraw_regions();
}

function add_new_layer() {
    var layer_id = app_context.layer_data.next_layer_id;
    app_context.layer_data.next_layer_id++;

    var new_display_div = document.createElement("div");
    new_display_div.innerHTML = load_template("layer_sidebar")({ layer_id: layer_id });

    app_context.layer_data.layers[layer_id] = {
        id: layer_id,
        z_index: layer_id,
        visible: true
    };

    app_context.layer_data.layer_shapes[layer_id] = [];

    document.getElementById("layers_sidebar").appendChild(new_display_div);

    $("#show_layer_"+layer_id).on("click", show_hide_layer);
    $("#layer_sidebar_"+layer_id).on("click", function() {
        select_layer(layer_id);
    });
    select_layer(layer_id);
}

function select_layer(id) {
    var last_selected = app_context.layer_data.selected_layer;
    if (last_selected) {
        $("#layer_sidebar_"+last_selected).removeClass("selected");
    }

    app_context.layer_data.selected_layer = id;

    $("#layer_sidebar_"+id).addClass("selected");
}

function get_active_layer() {
    return app_context.layer_data.selected_layer;
}

function get_invalid_area(shape) {
    if (shape.shape === 'circle') {
        return get_invalid_area_for_circle(shape.values);
    }
    else if (shape.shape === 'polygon') {
        return get_invalid_area_for_polygon(shape.values);
    }
    else if (shape.shape === 'line') {
        return get_invalid_area_for_line(shape.values);
    }
    else if (shape.shape === 'bezier') {
        return get_invalid_area_for_bezier(shape.values);
    }
    else if (shape.shape === 'text') {
        return get_invalid_area_for_text(shape.values);
    }
}

function find_intersecting_shapes(rectangle) {
    var intersecting_shapes = [];
    for (var layer_id in app_context.layer_data.layer_shapes) {
        if (app_context.layer_data.layer_shapes.hasOwnProperty(layer_id)) {
            var layer_shapes = app_context.layer_data.layer_shapes[layer_id];
            for (var i = 0; i < layer_shapes.length; i++) {
                var info = layer_shapes[i];
                if (area_overlap(rectangle, info.coverage_area)) {
                    intersecting_shapes.push(info);
                }
            }
        }
    }

    return intersecting_shapes;
}

function invalidate_rectangle(rectangle) {
    app_context.redraw_info.areas.push(rectangle);

    var intersecting_shapes = find_intersecting_shapes(rectangle);
    for (var i = 0; i < intersecting_shapes.length; i++) {
        app_context.redraw_info.shapes.push(intersecting_shapes[i]);
    }
}

function redraw_regions() {
    var canvas = document.getElementById("artboard");
    var context = canvas.getContext("2d");

    var origin = get_canvas_origin();
    context.save();
    context.beginPath();
    for (var i = 0; i < app_context.redraw_info.areas.length; i++) {
        var region = app_context.redraw_info.areas[i];
        context.rect(region.x + origin.x, region.y + origin.y, region.width, region.height);

    }
    context.clip();
    context.clearRect(0, 0, canvas.width, canvas.height);

    var sorted_shapes = app_context.redraw_info.shapes.sort(function(a, b) {
        if (a.layer < b.layer) {
            return -1;
        }
        if (a.layer > b.layer) {
            return 1;
        }

        if (a.z_index < b.z_index) {
            return -1;
        }
        if (a.z_index > b.z_index) {
            return 1;
        }

        return 0;
    });
    _draw_shapes(context, sorted_shapes, get_canvas_origin());

    app_context.redraw_info.areas = [];
    app_context.redraw_info.shapes = [];
    context.restore();
}

// To account for smoothing/line thickness?  make this more rigorous
var COVERAGE_SLOP = 4;
function area_overlap(region, rectangle) {
    // If this rectangle's region is already invalidated, don't compare it again
    if (rectangle.overlaps) {
        return false;
    }

    if ((region.x + region.width + COVERAGE_SLOP) < rectangle.x) {
        return false;
    }

    if ((region.y + region.height + COVERAGE_SLOP) < rectangle.y) {
        return false;
    }

    if (region.x > (rectangle.x + rectangle.width + COVERAGE_SLOP)) {
        return false;
    }

    if (region.y > (rectangle.y + rectangle.height + COVERAGE_SLOP)) {
        return false;
    }

    rectangle.overlaps = true;

    return true;
}

function draw_layer_previews() {
    $(app_context.layer_data.layers).each(function(idx, value){
        if(value !== undefined && app_context.layer_data.layer_shapes[value.id].length > 0){
            _draw_preview(value.id);
        }
    });
}

function _draw_preview(layer_id) {
    var temp_canvas = draw_temp_canvas(layer_id);
    var thumb_canvas = document.getElementById("layer_preview_" + layer_id);

    var dimensions = get_drawing_dimensions(layer_id);

    var preview_canvas_width = thumb_canvas.width;
    var preview_canvas_height = thumb_canvas.height;
    var scaled_width = dimensions.width;
    var scaled_height = dimensions.height;
    
    if (dimensions.width > preview_canvas_width) {
        scaled_width = preview_canvas_width;
        scaled_height = (scaled_width * dimensions.height) / dimensions.width;
    }
    if (scaled_height > preview_canvas_height) {
        scaled_height = preview_canvas_height;
        scaled_width = (scaled_height * dimensions.width) / dimensions.height;
    }
    var thumb_context = thumb_canvas.getContext('2d');
    thumb_context.clearRect(0, 0, 100, 100);
    thumb_context.drawImage(temp_canvas, 0, 0, scaled_width, scaled_height);
}

//Determine the maximum dimensions of all content across given layer
function get_drawing_dimensions(layer_id) {
    //Return 0 length dimensions of no shapes exist
    if(app_context.layer_data.layer_shapes[1].length === 0){
        return {"max_x": 0, "min_x": 0, "max_y": 0, "min_y": 0};
    }
    var starting_point = get_invalid_area(app_context.layer_data.layer_shapes[layer_id][0]);
    var max_x = starting_point.x + starting_point.width,
        min_x = starting_point.x,
        max_y = starting_point.y + starting_point.height,
        min_y = starting_point.y;

    layer_shapes = app_context.layer_data.layer_shapes[layer_id]
    if (layer_shapes !== undefined){
        $.each(layer_shapes, function (shape_id, shape){
            shape_area = get_invalid_area(shape);
            if (shape_area.x + shape_area.width > max_x) {
                max_x = shape_area.x + shape_area.width;
            } else if (shape_area.x < min_x) {
                min_x = shape_area.x;
            }
            if (shape_area.y + shape_area.height > max_y) {
                max_y = shape_area.y + shape_area.height;
            } else if (shape_area.y < min_y) {
                min_y = shape_area.y;
            }
        });
    }

    return {"max_x": max_x, "min_x": min_x, "max_y": max_y, "min_y": min_y, "height": Math.abs(min_y - max_y), "width": Math.abs(min_x - max_x)};
}

// Creates a temporary canvas containing the entire drawing for a given layer 
function draw_temp_canvas(layer_id) {
    var source_canvas = document.getElementById("artboard");
    var source_context = source_canvas.getContext("2d");

    var dimensions = get_drawing_dimensions(layer_id);

    var temp_canvas = document.createElement('canvas');
    $(temp_canvas).attr('height', dimensions.height).attr('width', dimensions.width);
    var temp_context = temp_canvas.getContext('2d');
    var origin = {'x':0, 'y':0};
    if (dimensions.min_x > 0){
        origin.x = origin.x - dimensions.min_x;
    } else if (dimensions.min_x < 0){
        origin.x = Math.abs(dimensions.min_x);
    }
    if (dimensions.min_y > 0){
        origin.y = origin.y - dimensions.min_y;
    } else if (dimensions.min_y < 0){
        origin.y = Math.abs(dimensions.min_y);
    }

    _draw_shapes(temp_context, app_context.layer_data.layer_shapes[layer_id], origin);

    return temp_canvas;
}

function _draw_shapes(context, shapes, origin) {
        for (var i = 0; i < shapes.length; i++) {
            var info = shapes[i];
            var shape = info.shape;
            var values = info.values;

            var shape_layer = info.layer;

            var color = 'black';
            if (info.selected_shape) {
                color = 'red';
            }
            if (shape === 'circle') {
                draw_circle(context, origin, color, values.cx, values.cy, values.radius);
            }
            else if (shape === 'polygon') {
                draw_polygon(context, origin, color, values.points);
            }
            else if (shape === 'line') {
                draw_line(context, origin, color, values.points);
            }
            else if (shape === 'bezier') {
                draw_bezier(context, origin, color, values.points);
            }
            else if (shape === 'text') {
                draw_text(context, origin, color, values);
            }

            info.coverage_area.overlaps = false;
        }
}

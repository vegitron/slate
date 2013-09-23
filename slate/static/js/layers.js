Slate.Layer = (function ($) {
    "use strict";

    var redraw_info = {
        areas: [],
        shapes: []
    },

    layer_data = {
        layers: [],
        layer_shapes: [],
        selected_layer: null,
        next_layer_id: 1
    };


    function show_hide_layer(ev) {
        var target = ev.target,
            layer_id = target.value,
            checked = target.checked,
            i;

        ev.stopPropagation();

        if (checked) {
            layer_data.layers[layer_id].visible = true;
        } else {
            layer_data.layers[layer_id].visible = false;
        }

        for (i = 0; i < layer_data.layer_shapes[layer_id].length; i++) {
            invalidate_rectangle(layer_data.layer_shapes[layer_id][i].coverage_area);
        }

        redraw_regions();
    }

    function add_layer_from_server(data) {
        var layer_id = data.id,
            new_display_div;

        // So we can add the layer from the response to the POST,
        // and not worry about the periodic update
        if (layer_data.layers[layer_id]) {
            return;
        }

        new_display_div = Slate.Handlebars.load_template("layer_sidebar")({ layer_id: layer_id, name: data.name });

        layer_data.layers[layer_id] = {
            id: layer_id,
            z_index: data.z_index,
            visible: true,
            name: data.name
        };

        layer_data.layer_shapes[layer_id] = [];

        $(document.getElementById("layers_sidebar_sortable")).append(new_display_div);

        select_layer(layer_id)

        $("#show_layer_" + layer_id).on("click", show_hide_layer);
        $("#layer_sidebar_" + layer_id).on("click", function () {
            select_layer(layer_id);
        });
        $("#delete_layer_" + layer_id).on("click", delete_layer);
        $("#layer_name_" + layer_id).on("click", function () {
             init_rename_layer(layer_id);
        });        

        layer_data.next_layer_id++;
    }

    function add_new_layer() {
        var layer_id = layer_data.next_layer_id,
            csrf_value = $("input[name='csrfmiddlewaretoken']")[0].value,

            post_args = {
                type: "POST",
                headers: {
                    "X-CSRFToken": csrf_value
                },

                data: JSON.stringify({ name: "Layer " + layer_id, z_index: layer_id }),
                success: add_layer_from_server
            };

        $.ajax(slate_home + '/rest/layer/' + artboard_url_token, post_args);
    }

    function select_layer(id) {
        var last_selected = layer_data.selected_layer;
        if (last_selected) {
            $("#layer_sidebar_" + last_selected).removeClass("selected");
        }

        layer_data.selected_layer = id;

        $("#layer_sidebar_" + id).addClass("selected");
    }

    function get_active_layer() {
        return layer_data.selected_layer;
    }

    function find_intersecting_shapes(rectangle) {
        var intersecting_shapes = [],
            layer_id,
            i,
            layer_shapes,
            info;

        for (layer_id in layer_data.layer_shapes) {
            if (layer_data.layer_shapes.hasOwnProperty(layer_id)) {
                if (layer_data.layers[layer_id].visible) {
                    if (layer_data.layer_shapes.hasOwnProperty(layer_id)) {
                        layer_shapes = layer_data.layer_shapes[layer_id];
                        for (i = 0; i < layer_shapes.length; i++) {
                            info = layer_shapes[i];
                            if (layer_shapes.hasOwnProperty(i)){
                                if (area_overlap(rectangle, info.coverage_area)) {
                                    intersecting_shapes.push(info);
                                }
                            }
                        }
                    }
                }
            }
        }

        return intersecting_shapes;
    }

    function invalidate_rectangle(rectangle) {
        redraw_info.areas.push(rectangle);

        var intersecting_shapes = find_intersecting_shapes(rectangle),
            i;
        for (i = 0; i < intersecting_shapes.length; i++) {
            redraw_info.shapes.push(intersecting_shapes[i]);
        }
    }

    function redraw_regions() {
        var canvas = document.getElementById("artboard"),
            context = canvas.getContext("2d"),
            i,
            origin = Slate.Artboard.get_canvas_origin(),
            region,
            sorted_shapes;

        context.save();
        context.beginPath();
        for (i = 0; i < redraw_info.areas.length; i++) {
            region = redraw_info.areas[i];
            context.rect(region.x + origin.x, region.y + origin.y, region.width, region.height);
        }
        context.clip();
        context.clearRect(0, 0, canvas.width, canvas.height);

        sorted_shapes = redraw_info.shapes.sort(function (a, b) {
            if (layer_data.layers[a.layer].z_index < layer_data.layers[b.layer].z_index) {
                return -1;
            }
            if (layer_data.layers[a.layer].z_index > layer_data.layers[b.layer].z_index) {
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

        draw_shapes(context, sorted_shapes, Slate.Artboard.get_canvas_origin());

        Slate.Select.show_selected_object_handles();

        redraw_info.areas = [];
        redraw_info.shapes = [];
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
        $(layer_data.layers).each(function (idx, value){
            if(value !== undefined && layer_data.layer_shapes[value.id].length > 0){
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
        
        // Invalid state error if either dimension is 0
        if (scaled_width > 0 || scaled_height > 0) {
            thumb_context.drawImage(temp_canvas, 0, 0, scaled_width, scaled_height);
        }
        
    }

    //Determine the maximum dimensions of all content across given layer
    function get_drawing_dimensions(layer_id) {
        var starting_point,
            layer_shapes;
        
        $.each(layer_data.layer_shapes[layer_id], function(shape_id, shape_object){
            if (shape_object !== undefined) {
                starting_point = Slate.Shape.get_invalid_area(shape_object);
            }
        });

        //Return dimensions of 0 if no shapes exist
        if (starting_point === undefined) {
            return {"max_x": 0, "min_x": 0, "max_y": 0, "min_y": 0, "height": 0, "width": 0};
        }

        var max_x = starting_point.x + starting_point.width,
            min_x = starting_point.x,
            max_y = starting_point.y + starting_point.height,
            min_y = starting_point.y;

        layer_shapes = layer_data.layer_shapes[layer_id]
        if (layer_shapes !== undefined){
            $.each(layer_shapes, function (shape_id, shape){
                if (shape !== undefined){
                    var shape_area = Slate.Shape.get_invalid_area(shape);
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

        draw_shapes(temp_context, layer_data.layer_shapes[layer_id], origin);

        return temp_canvas;
    }

    function draw_shapes(context, shapes, origin) {
        var i,
            info,
            shape,
            values,
            shape_layer,
            text_color,
            fill_color,
            border_color;

        for (i = 0; i < shapes.length; i++) {
            if (shapes.hasOwnProperty(i)){
                info = shapes[i];
                shape = info.shape;
                values = info.values;
    
                shape_layer = info.layer;
    
                if (shape === "text") {
                    text_color = values.color || "black";
                }
                else {
                    border_color = values.border_color || "black";
                    var border_width = values.border_width || 4;
                    fill_color = values.fill_color || "rgba(0, 0, 0, 0)";
                }
    
                if (shape === 'circle') {
                    Slate.Drawing.draw_circle(context, origin, border_width, border_color, fill_color, values.cx, values.cy, values.radius);
                }
                else if (shape === 'polygon') {
                    Slate.Drawing.draw_polygon(context, origin, border_width, border_color, fill_color, values.points);
                }
                else if (shape === 'line') {
                    Slate.Drawing.draw_line(context, origin, border_width, border_color, values.points);
                }
                else if (shape === 'bezier') {
                    Slate.Drawing.draw_bezier(context, origin, border_width, border_color, values.points);
                }
                else if (shape === 'text') {
                    Slate.Drawing.draw_text(context, origin, text_color, values);
                }
    
                info.coverage_area.overlaps = false;
            }
            
        }
    }

    function delete_layer(ev) {
        var target = ev.target,
            layer_id = target.value,
            origin = Slate.Artboard.get_canvas_origin(),
            canvas = document.getElementById("artboard"),
            csrf_value = $("input[name='csrfmiddlewaretoken']")[0].value,
            post_args = {
                type: "DELETE",
                headers: {
                    "X-CSRFToken": csrf_value
                },
            },
            layer;

        ev.stopPropagation();
        delete layer_data.layer_shapes[layer_id];
        delete layer_data.layers[layer_id];
        
        invalidate_rectangle({
            x: -1 * origin.x - 10,
            y: -1 * origin.y - 10,
            width: canvas.width + 20,
            height: canvas.height + 20
        });
        redraw_regions();
        $("#layer_sidebar_" + layer_id).remove();
        
        for (layer in layer_data.layers) {
            if (layer_data.layers.hasOwnProperty(layer)){
                select_layer(layer);
                break;
            }
        }

        $.ajax(slate_home + '/rest/layer/' + artboard_url_token + "/" + layer_id, post_args);
    }

    function delete_shape(shape_object) {
        var shape_layer = shape_object.layer,
            shape_id = shape_object.id,
            id_to_delete,
            csrf_value = $("input[name='csrfmiddlewaretoken']")[0].value,
            post_args = {
                type: "DELETE",
                headers: {
                    "X-CSRFToken": csrf_value
                },
            };

        var layer_objs = layer_data.layer_shapes[shape_layer];
        for (var i = 0; i < layer_objs.length; i++) {
            if (layer_objs.hasOwnProperty(i)){
                if (layer_objs[i].id === shape_object.id){
                    id_to_delete = i;
                }
            }
        }
        Slate.Select.deselect_current_object();
        delete layer_data.layer_shapes[shape_layer][id_to_delete];
        invalidate_rectangle(shape_object.coverage_area);
        redraw_regions();
        draw_layer_previews();
        $.ajax(slate_home + '/rest/shape/' + artboard_url_token + "/" + shape_id, post_args);
    }

    function get_shape_count_for_layer(layer_id) {
        return layer_data.layer_shapes[layer_id].length;
    }

    function add_shape_to_layer(layer_id, shape) {
        layer_data.layer_shapes[layer_id].push(shape);
    }

    function init_rename_layer(layer_id) {
        var form = $("#layer_sidebar_" + layer_id +"> form")[0],
            old_name = $("#layer_name_" + layer_id).html(),
            new_name;
        $(form).submit(function (e) {
            new_name = $(form).children('[name="rename_layer"]').first().val();
            if (old_name !== new_name && old_name.length > 0) {
                update_layer(layer_id, {'name': new_name});
                $("#layer_name_" + layer_id).html(new_name);
                $(form).hide();
            }
            return false;
        });
        $(form).toggle();
    }

    function update_layer(layer_id, layer_props) {
        var json_payload = layer_data.layers[layer_id],
            csrf_value = $("input[name='csrfmiddlewaretoken']")[0].value,
            post_args = {
                type: "PUT",
                headers: {
                    "X-CSRFToken": csrf_value
                },
                dataType: 'json'
            };
        if(layer_props.hasOwnProperty("name")){
            json_payload['name'] = layer_props['name'];
        }
        if(layer_props.hasOwnProperty("z_index")){
            json_payload['z_index'] = layer_props['z_index'];
        }
        post_args['data'] = JSON.stringify(json_payload);
        $.ajax(slate_home + '/rest/layer/' + artboard_url_token + "/" + layer_id, post_args);
    }

    function reorder_layers(event, ui) {
        var layer_id,
            layer_index,
            items,
            item = ui['item'],
            origin = Slate.Artboard.get_canvas_origin(),
            canvas = document.getElementById("artboard");
        layer_id = $(item).attr('id');
        layer_index = layer_id.match(/layer_sidebar_(.*)/)[1];
        items = $("#layers_sidebar_sortable").sortable("toArray");
        update_z_indices(items);
        invalidate_rectangle({
            x: -1 * origin.x - 10,
            y: -1 * origin.y - 10,
            width: canvas.width + 20,
            height: canvas.height + 20
        });
        redraw_regions();
        update_layer(layer_index, {z_index: layer_data.layers[layer_index].z_index});
    }

    function update_z_indices(items) {
        var layer_index;

        $(items).each(function (index, layer_id) {
            layer_index = layer_id.match(/layer_sidebar_(.*)/)[1];
            layer_data.layers[layer_index].z_index = index + 1;
        });
    }

    return {
        add_new_layer: add_new_layer,
        add_layer_from_server: add_layer_from_server,
        draw_shapes: draw_shapes,
        get_active_layer: get_active_layer,
        find_intersecting_shapes: find_intersecting_shapes,
        area_overlap: area_overlap,
        draw_layer_previews: draw_layer_previews,
        redraw_regions: redraw_regions,
        invalidate_rectangle: invalidate_rectangle,
        get_shape_count_for_layer: get_shape_count_for_layer,
        add_shape_to_layer: add_shape_to_layer,
        delete_shape: delete_shape,
        reorder_layers: reorder_layers,
        select_layer: select_layer
    }



})(jQuery);

function update_origin_from_url() {
    var test_match = [slate_home, "\/board\/", artboard_url_token, "\/([\-0-9]+),([\-0-9]+)"].join("")

    var matches = window.location.href.match(test_match);
    if (matches) {
        var origin_x = parseFloat(matches[1]);
        var origin_y = parseFloat(matches[2]);
        update_display_origin(origin_x, origin_y);
    }
}

function post_artboard_data(data) {
    update_origin_from_url();

    for (var i = 0; i < data.layers.length; i++) {
        add_layer_from_server(data.layers[i]);
    }

    for (var i = 0; i < data.shapes.length; i++) {
        add_shape_from_server(data.shapes[i]);
    }

    draw_layer_previews();
    redraw_regions();

    $("#add_layer").on("click", add_new_layer);
    add_drawing_events();

    resize_canvas_surfaces();
    $(window).on("resize", resize_canvas_surfaces);

    $("#loading_cover").hide();
}


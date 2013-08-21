function post_artboard_data(data) {
    for (var i = 0; i < data.layers.length; i++) {
        add_layer_from_server(data.layers[i]);
    }
    $("#add_layer").on("click", add_new_layer);
    add_drawing_events();

    resize_canvas_surfaces();
    $(window).on("resize", resize_canvas_surfaces);

    $("#loading_cover").hide();
}


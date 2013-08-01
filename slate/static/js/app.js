var app_context = {};

function resize_canvas_surfaces() {
    // Doing this, because $().width() with set a style - but that scales the
    // canvas up, instead of resizing it.
    document.getElementById("artboard").width = $(window).width();
    document.getElementById("artboard").height = $(window).height();

    document.getElementById("draw_surface").width = $(window).width();
    document.getElementById("draw_surface").height = $(window).height();
}

$(document).ready(function() {
    add_new_layer();

    $("#add_layer").on("click", add_new_layer);

    add_drawing_events();

    resize_canvas_surfaces();
    $(window).on("resize", resize_canvas_surfaces);
});



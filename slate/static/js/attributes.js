
function handle_shape_fill_color_change() {
    app_context.drawing_state.fill_color = $("input[name='shape_fill_color']").val();
}

function handle_shape_border_color_change() {
    app_context.drawing_state.border_color = $("input[name='shape_border_color']").val();
}

function handle_shape_line_width_change() {
    app_context.drawing_state.border_width = parseInt($("input[name='shape_line_width']:checked").val());
}

function handle_text_color_change () {
    app_context.drawing_state.text_info.color = $("input[name='text_color']").val();
}

function handle_text_size_change () {
    app_context.drawing_state.text_info.font_size = parseInt($("input[name='text_font_size']:checked").val());
}

function add_attribute_events() {
    $("input[name='shape_line_width']").on("change", handle_shape_line_width_change);
    $("input[name='shape_border_color']").on("change", handle_shape_border_color_change);
    $("input[name='shape_fill_color']").on("change", handle_shape_fill_color_change);
    $("input[name='text_color']").on("change", handle_text_color_change);
    $("input[name='text_font_size']").on("change", handle_text_size_change);

    handle_shape_fill_color_change();
    handle_shape_border_color_change();
    handle_shape_line_width_change();
    handle_text_size_change();
    handle_text_color_change();
}



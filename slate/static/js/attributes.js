Slate.Attributes = (function ($) {
    "use strict";
    function handle_shape_fill_color_change() {
        var new_color = $("input[name='shape_fill_color']").val(),
            object_copy;

        if (app_context.select_state.selected_object) {
            object_copy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
            object_copy.values.fill_color = new_color;
            Slate.Drawing.update_shape_on_artboard(object_copy);
        } else {
            app_context.drawing_state.fill_color = new_color;
        }
    }

    function handle_shape_border_color_change() {
        var new_color = $("input[name='shape_border_color']").val(),
            object_copy;

        if (app_context.select_state.selected_object) {
            object_copy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
            object_copy.values.border_color = new_color;
            Slate.Drawing.update_shape_on_artboard(object_copy);
        } else {
            app_context.drawing_state.border_color = new_color;
        }
    }

    function handle_shape_line_width_change() {
        var new_width = parseInt($("input[name='shape_line_width']:checked").val(), 10),
            object_copy;

        if (app_context.select_state.selected_object) {
            object_copy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
            object_copy.values.border_width = new_width;
            Slate.Drawing.update_shape_on_artboard(object_copy);
        } else {
            app_context.drawing_state.border_width = new_width
        }
    }

    function handle_text_color_change() {
        var new_color = $("input[name='text_color']").val(),
            object_copy;
        if (app_context.select_state.selected_object) {
            object_copy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
            object_copy.values.color = new_color;
            Slate.Drawing.update_shape_on_artboard(object_copy);
        } else {
            app_context.drawing_state.text_info.color = new_color;
        }
    }

    function handle_text_size_change() {
        var new_size = parseInt($("input[name='text_font_size']:checked").val(), 10),
            object_copy;

        if (app_context.select_state.selected_object) {
            object_copy = JSON.parse(JSON.stringify(app_context.select_state.selected_object));
            object_copy.values.font_size = new_size;

            Slate.Drawing.update_shape_on_artboard(object_copy);
        } else {
            app_context.drawing_state.text_info.font_size = new_size;
        }
    }

    function handle_new_board_action_selection() {
        var selected_action = $("input[name='board_actions']:checked").val(),
            panel;
        hide_shape_attribute_controls();

        if (selected_action !== "select") {
            Slate.Select.deselect_current_object();
        }

        if (selected_action === "text") {
            panel = $("#text_controls");
            panel.addClass("new_content_attributes_panel");
            panel.show();
        }

        if ((selected_action === "rectangle") || (selected_action  === "autoshape")) {
            panel = $("#shape_controls");
            panel.addClass("new_content_attributes_panel");
            panel.show();
        }
    }

    function add_attribute_events() {
        $("input[name='shape_line_width']").on("change", handle_shape_line_width_change);
        $("input[name='shape_border_color']").on("change", handle_shape_border_color_change);
        $("input[name='shape_fill_color']").on("change", handle_shape_fill_color_change);
        $("input[name='text_color']").on("change", handle_text_color_change);
        $("input[name='text_font_size']").on("change", handle_text_size_change);

        $("input[name='board_actions']").on("change", handle_new_board_action_selection);

        handle_shape_fill_color_change();
        handle_shape_border_color_change();
        handle_shape_line_width_change();
        handle_text_size_change();
        handle_text_color_change();
    }

    function hide_shape_attribute_controls() {
        reset_attribute_panel($("#shape_controls"));
        reset_attribute_panel($("#text_controls"));
    }

    function reset_attribute_panel(panel) {
        panel.hide();
        panel.removeClass("new_content_attributes_panel");
        panel.css("left", '');
        panel.css("top", '');
    }

    function load_attributes_for_shape(shape) {
        // Just to reset all attribute panels
        load_attributes_for_new_object();
        hide_shape_attribute_controls();

        var type = shape.shape,
            panel,
            origin,
            window_width,
            window_height;

        if (type === "text") {
            set_text_attribute_display({
                size: shape.values.font_size || 24,
                color: shape.values.color || 'black'
            });

            panel = $("#text_controls");
        } else {
            set_shape_attribute_display({
                fill: shape.values.fill_color || 'rgba(255, 255, 0, .1)',
                border: shape.values.border_color || 'black',
                thickness: shape.values.border_width || 4
            });

            panel = $("#shape_controls");
        }

        origin = Slate.Artboard.get_canvas_origin();
        window_width = $(window).width();
        window_height = $(window).height();

        panel.css("top", shape.coverage_area.y + origin.y - panel.height());
        panel.css("left", shape.coverage_area.x + origin.x);
        panel.show();
    }

    function set_shape_attribute_display(values) {
        $("input[name='shape_fill_color']").val(values.fill);
        $("input[name='shape_border_color']").val(values.border);

        var width_value = values.thickness,
            input = $("input[name='shape_line_width'][value='" + width_value + "']");
        if (!input) {
            // Just select the second one - maybe the middle?
            input = $("input[name='shape_line_width']:eq(1)");
            input.prop("checked", true);
            handle_shape_line_width_change();
        }
        input.prop("checked", true);
    }

    function set_text_attribute_display(values) {
        $("input[name='text_color']").val(values.color);

        var text_size = values.size,
            text_input = $("input[name='text_font_size'][value='" + text_size + "']");
        if (!text_input) {
            // Just select the second one - maybe the middle?
            text_input = $("input[name='text_font_size']:eq(1)");
            text_input.prop("checked", true);
            handle_text_size_change();
        }
        text_input.prop("checked", true);

    }

    function load_attributes_for_new_object() {
        set_shape_attribute_display({
            fill: app_context.drawing_state.fill_color,
            border: app_context.drawing_state.border_color,
            thickness: app_context.drawing_state.border_width,
        });


        set_text_attribute_display({
            color: app_context.drawing_state.text_info.color,
            size: app_context.drawing_state.text_info.font_size
        });

    }

    return {
        add_attribute_events: add_attribute_events,
        load_attributes_for_new_object: load_attributes_for_new_object,
        hide_shape_attribute_controls: hide_shape_attribute_controls,
        load_attributes_for_shape: load_attributes_for_shape
    };

})(jQuery);

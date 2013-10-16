Slate.Shape.Text = (function ($) {
    "use strict";
    function resize(shape, width_scale, height_scale) {
        var initial_text_for_size = shape.values.reflowed_text || shape.values.text,
            text_size = get_text_size({
                text: initial_text_for_size,
                font_size: shape.values.font_size,
                font_face: shape.values.font_face
            }),

            new_width = text_size.width * width_scale,
            reflowed_text;

        if (text_size < new_width) {
            delete shape.values.reflowed_text;
            return;
        }


        reflowed_text = reflow_text(new_width);
        shape.values.reflowed_text = reflowed_text;

        function reflow_text(new_width) {
            var original_lines = shape.values.text.split(/\r?\n/),
                reflowed_lines = [],
                i,
                reflowed_line;

            if (new_width < 0) {
                new_width *= -1;
            }

            for (i = 0; i < original_lines.length; i++) {
                reflowed_line = get_reflowed_line(original_lines[i], new_width);
                reflowed_lines = reflowed_lines.concat(reflowed_line);
            }

            return reflowed_lines.join("\n");
        }

        function get_reflowed_line(line, width) {
            var words = line.split(/ /);

            return get_reflowed_words(words, width);
        }

        function get_reflowed_words(words, width) {
            if (words.length === 1) {
                return [words[0]];
            }

            var i,
                test_string,
                sub_size,
                reflowed,
                new_matches,
                remaining;

            for (i = words.length + 1; i > 0; i--) {
                test_string = words.slice(0, i).join(" ");
                sub_size = get_text_size({
                    text: test_string,
                    font_size: shape.values.font_size,
                    font_face: shape.values.font_face
                });

                if (sub_size.width < width) {
                    reflowed = [];
                    reflowed.push(test_string);

                    if (i < words.length) {
                        new_matches = get_reflowed_words(words.slice(i), width);
                        reflowed = reflowed.concat(new_matches);
                    }

                    return reflowed;
                }
            }

            reflowed = [];
            reflowed.push(words[0]);

            if (words.length > 1) {
                remaining = words.slice(1).join(" ");
                reflowed = reflowed.concat(get_reflowed_words(words.slice(1), width));
            }
            return reflowed;
        }
    }

    function rotate_point(sin, cos, center_x, center_y, x, y) {
        var offset_x = x - center_x;
        var offset_y = y - center_y;

        var tmp_x = (offset_x * cos) - (offset_y * sin);
        var tmp_y = (offset_x * sin) + (offset_y * cos);

        return {
            x: tmp_x + center_x,
            y: tmp_y + center_y
        };
    }

    function get_invalid_area(info) {
        var text = info.reflowed_text || info.text,

            size = get_text_size({
                text: text,
                font_size: info.font_size,
                font_face: info.font_face
            }),
            angle = info.angle || 0,
            angle_sin,
            angle_cos,
            center_x,
            center_y,
            points = [],
            i,
            rotated,
            final_rectangle = {};

        points.push({
            x: info.x - INVALID_AREA_SLOP,
            y: info.y - INVALID_AREA_SLOP
        });

        points.push({
            x: info.x - INVALID_AREA_SLOP + size.width + (2 * INVALID_AREA_SLOP),
            y: info.y - INVALID_AREA_SLOP
        });

        points.push({
            x: info.x - INVALID_AREA_SLOP,
            y: info.y - INVALID_AREA_SLOP + size.height + (2 * INVALID_AREA_SLOP)
        });

        points.push({
            x: info.x - INVALID_AREA_SLOP + size.width + (2 * INVALID_AREA_SLOP),
            y: info.y - INVALID_AREA_SLOP + size.height + (2 * INVALID_AREA_SLOP)
        });

        angle_sin = Math.sin(angle * Math.PI / 180);
        angle_cos = Math.cos(angle * Math.PI / 180);

        center_x = info.x + (size.width / 2);
        center_y = info.y + (size.height / 2);

        var min_x = Number.MAX_VALUE;
        var min_y = Number.MAX_VALUE;
        var max_x = -1 * Number.MAX_VALUE;
        var max_y = -1 * Number.MAX_VALUE;

        for (i = 0; i < points.length; i++) {
            rotated = rotate_point(angle_sin, angle_cos, center_x, center_y, points[i].x, points[i].y);

            if (rotated.x > max_x) {
                max_x = rotated.x;
            }
            if (rotated.x < min_x) {
                min_x = rotated.x;
            }
            if (rotated.y > max_y) {
                max_y = rotated.y;
            }
            if (rotated.y < min_y) {
                min_y = rotated.y;
            }
        }

        return {
            x: min_x,
            y: min_y,
            width: max_x - min_x,
            height: max_y - min_y
        };

    }

    function get_text_size(info) {
        var offscreen = $("#offscreen_text_test"),
            escaped_text = offscreen.text(info.text).html(),
            test_html = escaped_text.replace(/\n/g, "<br/>");

        test_html = test_html.replace(/ /g, "&nbsp;");
        offscreen.html(test_html);

        offscreen.css("font-size", info.font_size);
        offscreen.css("font-family", info.font_face);

        return {
            width: offscreen.width(),
            height: offscreen.height()
        };
    }

    function move(shape, dx, dy) {
        shape.values.x += dx;
        shape.values.y += dy;
    }

    function rotate(shape, angle) {
        shape.values.angle = angle;
    }


    return {
        get_invalid_area: get_invalid_area,
        move: move,
        rotate: rotate,
        resize: resize,
        get_text_size: get_text_size
    };
})(jQuery);

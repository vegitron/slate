/// XXX - fix the 500 constant
var AutoShape = function() {
    "use strict";
    // All of these constants are pretty arbitrary
    var HOUGH_CELL_SIZE = 5;
    var MAX_ANGLE_IN_POLYGON = 140;
    var CIRCLE_ERROR_THRESHOLD = 10;
    var LINE_ERROR_THRESHOLD = 20;

    var CLOSE_ANGLE_THRESHOLD = 40 * Math.PI / 180;

    var SEEN_ANGLE_DEGREE_THRESHOLD = 30;
    var SEEN_ANGLE_PIXEL_THRESHOLD = 30;

    // From http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    function square(x) { return x * x; }
    function dist2(v, w) { return square(v.x - w.x) + square(v.y - w.y); }
    function distToSegmentSquared(p, v, w) {
        var l2 = dist2(v, w);
        if (l2 == 0) { return dist2(p, v); }
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        if (t < 0) { return dist2(p, v); }
        if (t > 1) { return dist2(p, w); }
        return dist2(p, { x: v.x + t * (w.x - v.x),
                            y: v.y + t * (w.y - v.y) });
    }



    function polygon_area(points) {
        var total = 0,
            i = 0;
        for (i = 0; i < points.length -1; i++) {
            var px1 = points[i].x;
            var py1 = points[i].y;
            var px2 = points[i + 1].x;
            var py2 = points[i + 1].y;

            var dx = px2 - px1;
            var average_y = (py2 + py1) / 2;

            var part_size = dx * average_y;

            total += part_size;
        }

        return total;
    }

    // These are angles from the center of a polygon - there's no need
    // for a lot of detail around a corner
    function prune_close_angles(angle, others) {
        var new_list = [];
        var threshold = CLOSE_ANGLE_THRESHOLD;
        var angle_rads = angle.rads;
        var i, test_rads;

        var max_drop = angle_rads + threshold;
        var min_drop = angle_rads - threshold;

        for (i = 0; i < others.length; i++) {
            test_rads = others[i].rads;

            if (test_rads > max_drop || test_rads < min_drop) {
                new_list.push(others[i]);
            }
        }
        return new_list;
    }


    // Hough lines that are almost the same just add noise, and make it harder to find good polygons
    function seen_angle(angle, slope, x, y, seen_angles) {
        var i,
            angle_diff,
            x2,
            y2,
            point_diff;
        // If this is more than 30 degrees from any previous line, it's definitely not seen
        // If it's less than 30, we need to see where it intersects, so we don't exclue parallel lines
        for (i = 0; i < seen_angles.length; i++) {
            angle_diff = Math.abs(seen_angles[i].a - angle);
            if (angle_diff < SEEN_ANGLE_DEGREE_THRESHOLD) {
                x2 = seen_angles[i].x;
                y2 = seen_angles[i].y;
                point_diff = Math.sqrt(square(x-x2) + square(y-y2));

                if (point_diff < SEEN_ANGLE_PIXEL_THRESHOLD) {
                    return true;
                }
            }
        }

        return false;
    }


    function angle_between_points(p1, p2, p3) {
        var d12_sq = dist2(p1, p2);
        var d13_sq = dist2(p1, p3);
        var d23_sq = dist2(p2, p3);

        var cos = (d23_sq + d12_sq - d13_sq) / (2 * Math.sqrt(d23_sq) * Math.sqrt(d12_sq));
        // This can happen due to floating point rounding - was seeing values like -1.0000000000000007
        if (cos < -1) {
            cos = -1;
        }
        if (cos > 1) {
            cos = 1;
        }
        var radians = Math.acos(cos);

        return radians * 180 / Math.PI;
    }

    function intersection_point(s1, x1, y1, s2, x2, y2) {
        var x_intercept, y_intercept;
        if (s1 == s2) {
            return;
        }

        // That's a vertical line.  An 89 degree angle has a slope of
        // ~57.3, this check will be OK up to 89.7 degrees
        if (s1 > 200) {
            y_intercept = -1 * s2 * (x2 - x1) - y2;
            return { x: x1, y: y_intercept };
        }

        if (s2 > 200) {
            x_intercept = x2;
        }
        else {
            x_intercept = (y1 - y2 + (x1 * s1) - (x2 * s2)) / (s1 - s2);
        }
        y_intercept = -1 * s1 * (x1 - x_intercept) - y1;
        return { x: x_intercept, y: y_intercept };
    }

    function find_line_error_for_point(point, line) {
        return distToSegmentSquared(point, line[0], line[1]);
    }

    function find_polygon_error_for_point(point, verticies) {
        var smallest_error = Number.MAX_VALUE;
        var i;

        if (!verticies.length) { return 0; }

        for (i = 0; i < verticies.length -1; i++) {
            var distance_squared = distToSegmentSquared(point, verticies[i], verticies[i+1]);

            if (distance_squared < smallest_error) {
                smallest_error = distance_squared;
            }
        }
        return smallest_error;
    }

    function get_intersection(point, line) {

        var line_angle = line.a + 90;
        var line_distance = line.d;

        var point1_x = line_distance * Math.sin(line_angle * Math.PI / 180);
        var point1_y = line_distance * Math.cos(line_angle * Math.PI / 180);

        var line_x1 = 0;
        var line_x2 = 500;

        var line_y1, line_y2;

        if (line_angle == 90) {
            line_x1 = line_distance;
            line_x2 = line_distance;
            line_y1 = 0;
            line_y2 = 500;
        }
        else {
            var line_slope = Math.tan(line_angle * Math.PI / 180);
            line_y1 = -1 * (point1_x * line_slope) - point1_y;
            line_y2 = -1 * ((point1_x - 500) * line_slope) - point1_y;
        }

        var intersect_angle = line_angle - 90;

        var intersect_x1 = point.x;
        var intersect_y1 = point.y;

        var intersect_x2, intersect_y2;

        if (intersect_angle == -90) {
            intersect_x2 = point.x;
            intersect_y1 = 0;
            intersect_y2 = 500;

        }
        else {
            var intersect_slope = Math.tan(intersect_angle * Math.PI / 180);
            intersect_x2 = intersect_x1 + 200;
            intersect_y2 = 200 * intersect_slope + intersect_y1;
        }

        var x1 = line_x1;
        var x2 = line_x2;
        var y1 = line_y1;
        var y2 = line_y2;

        var x3 = intersect_x1;
        var x4 = intersect_x2;
        var y3 = intersect_y1;
        var y4 = intersect_y2;

        // http://en.wikipedia.org/wiki/Line-line_intersection#Mathematics
        var px = ((((x1 * y2) - (y1 * x2)) * (x3 - x4)) - ((x1 - x2) * ((x3 * y4) - (y3 * x4)))) / (((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4)));

        var py = ((((x1 * y2) - (y1 * x2)) * (y3 - y4)) - ((y1 - y2) * ((x3 * y4) - (y3 * x4)))) / (((x1 - x2) * (y3 - y4)) - ((y1 - y2) * (x3 - x4)));

        return { x: px, y: py };

    }

    function fill_gap_linear(x1, y1, x2, y2) {

        var distance = Math.sqrt(square(x2 - x1) + square(y2 - y1));
        var steps = Math.floor(distance);
        var fills = [];
        var i;
        for (i = 1; i < steps; i++) {
            var fill_x = (((x2 - x1) / steps) * i) + x1;
            var fill_y = (((y2 - y1) / steps) * i) + y1;

            fills.push({'x': fill_x, 'y': fill_y });
        }

        return fills;
    }



    function linear_hough_accumulator(base_points) {
        // We need to fill in points, otherwise a slowly drawn section will have many more data points,
        // and improperly bias the accumulator.
        var input_points = [];
        var i,
            f,
            angle;
        for (i = 0; i < base_points.length; i++) {
            if (i > 0) {
                var fills = fill_gap_linear(base_points[i-1].x, base_points[i-1].y, base_points[i].x, base_points[i].y);
                for (f = 0; f < fills.length; f++) {
                    input_points.push(fills[f]);
                }
            }
        }


        var accumulator = [];
        for (angle = 0; angle < 180; angle += 5) {
            accumulator[angle/5] = [];
        }

        var max_accumulator;

        for (i = 0; i < input_points.length; i++) {
            var px = input_points[i].x;
            var py = input_points[i].y;

            for (angle = 0; angle < 180; angle += 5) {
                var radians = Math.PI * angle / 180.0;
                var dist = px * Math.cos(radians) + py * Math.sin(radians);

                var accumulator_distance;
                if (dist > 0) {
                    accumulator_distance = Math.floor(dist/HOUGH_CELL_SIZE) * HOUGH_CELL_SIZE;
                }
                else {
                    accumulator_distance = Math.ceil(dist/HOUGH_CELL_SIZE) * HOUGH_CELL_SIZE;
                }

                if (!accumulator[angle/5][(accumulator_distance + 500) / HOUGH_CELL_SIZE]) {
                    accumulator[angle/5][(accumulator_distance + 500) / HOUGH_CELL_SIZE] = 0;
                }
                accumulator[angle/5][(accumulator_distance + 500) / HOUGH_CELL_SIZE] += 1;
            }
        }

        return accumulator;
    }

    function line_candidates_from_acumulator(accumulator) {
        var line_candidates = [];
        var i,
            j;
        for (i = 0; i < accumulator.length; i++) {
            for (j = 0; j < accumulator[i].length; j++) {
                var value = accumulator[i][j];

                if (value > 0) {
                    line_candidates.push({'value': value, 'a': i*5, 'd': (j * HOUGH_CELL_SIZE) - 500 });
                }
            }
        }

        var sorted_lines = line_candidates.sort(function(a, b) {
            return (b.value - a.value);
        });

        return sorted_lines;
    }

    function get_bounding_box(points) {
        var i = 0,
            point_length = points.length,
            min_x = Number.MAX_VALUE,
            max_x = 0,
            min_y = Number.MAX_VALUE,
            max_y = 0,
            px = 0,
            py = 0;

        for (i = 0; i < point_length; i++) {
            px = points[i].x;
            py = points[i].y;

            if (px < min_x) {
                min_x = px;
            }
            if (py < min_y) {
                min_y = py;
            }
            if (px > max_x) {
                max_x = px;
            }
            if (py > max_y) {
                max_y = py;
            }
        }

        return {
            min_x: min_x,
            max_x: max_x,
            min_y: min_y,
            max_y: max_y
        };
    }

    function intersections_from_lines(sorted_lines, bounding_box) {
        var best_value = sorted_lines[0].value,
            threshold = best_value / 2,
            seen_angles = [],
            keepers = [],
            min_x = bounding_box.min_x,
            max_x = bounding_box.max_x,
            min_y = bounding_box.min_y,
            max_y = bounding_box.max_y,
            i,
            j;

        for (i = 0; i < 12; i++) {
            var max_values = sorted_lines[i];

            var line_angle = max_values.a + 90;
            var line_slope = Math.tan(line_angle * Math.PI / 180);
            var point1_x = max_values.d * Math.sin(line_angle * Math.PI / 180);
            var point1_y = max_values.d * Math.cos(line_angle * Math.PI / 180);

            if (seen_angle(line_angle, line_slope, point1_x, point1_y, seen_angles)) {
                continue;
            }
            seen_angles.push({ 'a': line_angle, 's': line_slope, 'x': point1_x, 'y': point1_y });
        }

        var percent = 0.2;

        var x_range = max_x - min_x;
        var min_intersect_x = min_x - percent * x_range;
        var max_intersect_x = max_x + percent * x_range;

        var y_range = max_y - min_y;
        var min_intersect_y = min_y - percent * y_range;
        var max_intersect_y = max_y + percent * y_range;

        var intersections = [];
        for (i = 0; i < seen_angles.length; i++) {
            var seen_i = seen_angles[i];

            for (j = 0; j < i; j++) {
                var seen_j = seen_angles[j];
                var intersection = intersection_point(seen_i.s, seen_i.x, seen_i.y, seen_j.s, seen_j.x, seen_j.y);

                if (intersection) {
                    if (intersection.x < min_intersect_x || intersection.x > max_intersect_x) {
                        continue;
                    }
                    if (intersection.y < min_intersect_y || intersection.y > max_intersect_y) {
                        continue;
                    }

                    intersections.push(intersection);
                }
            }
        }

        return intersections;
    }

    function find_polygon_in_intersections(intersections) {
        var total_intersection_x = 0;
        var total_intersection_y = 0;

        var max_i_x = 0;
        var max_i_y = 0;
        var min_i_x = Number.MAX_VALUE;
        var min_i_y = Number.MAX_VALUE;
        var i,
            i_x,
            i_y;

        for (i = 0; i < intersections.length; i++) {
            i_x = intersections[i].x;
            i_y = intersections[i].y;
            if (max_i_x < i_x) {
                max_i_x = i_x;
            }
            if (max_i_y < i_y) {
                max_i_y = i_y;
            }
            if (min_i_x > i_x) {
                min_i_x = i_x;
            }
            if (min_i_y > i_y) {
                min_i_y = i_y;
            }

        }

        var center_x = (max_i_x + min_i_x) / 2;
        var center_y = (max_i_y + min_i_y) / 2;


        var intersection_from_center_info = [];
        var angles = [];
        for (i = 0; i < intersections.length; i++) {
            var angle_rads;
            i_x = intersections[i].x;
            i_y = intersections[i].y;

            // Using law of cosigns to get the angle.  Point 3 is 200 px to the right of the center point.
            var lenA = Math.sqrt(square(center_x - i_x) + square(center_y - i_y));
            var lenB = Math.sqrt(square(center_x + 200 - i_x) + square(center_y - i_y));
            // This is just 200 px to the right of the center point
            var lenC = 200;


            angle_rads = Math.acos((square(lenB) - square(lenA) - square(lenC)) / (2 * lenA * lenC));

            // If the test spot is below center, we need to add PI radians, otherwise it'll just mirror things above it
            if (i_y < center_y) {
                angle_rads *= -1;
            }

            var degrees = angle_rads * 180 / Math.PI;
            /*
            if (degrees < 0) {
                degrees += 360;
            }*/

            intersections[i].rads = angle_rads;
            intersections[i].distance_from_center = Math.sqrt(square(i_x - center_x) + square(i_y - center_y));
        }

        var by_distance = intersections.sort(function(a, b) { return b.distance_from_center - a.distance_from_center; });

        var accepted_vertix = [];

        while (by_distance.length) {
            var furthest = by_distance.shift();
            accepted_vertix.push(furthest);

            by_distance = prune_close_angles(furthest, by_distance);
        }


        accepted_vertix.sort(function(a, b) { return a.rads - b.rads; });

        accepted_vertix.push(accepted_vertix[0]);
        accepted_vertix.push(accepted_vertix[1]);

        var prune_indicies = [];
        for (i = 1; i < accepted_vertix.length - 1; i ++) {
            var angle = angle_between_points(accepted_vertix[i - 1], accepted_vertix[i], accepted_vertix[i + 1]);

            if (angle > MAX_ANGLE_IN_POLYGON) {
                prune_indicies[i] = true;
            }
        }

        accepted_vertix.pop();

        // If the first vertix is to be pruned, it won't be found until the wrap-around at the end
        if (prune_indicies[accepted_vertix.length - 1]) {
            prune_indicies[0] = true;
        }
        // Remove the extra wrap-around for the angle tests

        var final_list = [];
        for (i = 0; i < accepted_vertix.length; i++) {
            if (prune_indicies[i]) {
                continue;
            }
            final_list.push(accepted_vertix[i]);
        }

        // Re-create the wrap-around if we've pruned the first/last element
        if (prune_indicies[accepted_vertix.length - 1]) {
            final_list.push(final_list[0]);
        }

        return final_list;
    }



    function find_polygon(input_points) {
        var min_dist = Number.MAX_VALUE;
        var max_dist = -1 * Number.MAX_VALUE;

        var accumulator = linear_hough_accumulator(input_points);
        var sorted_lines = line_candidates_from_acumulator(accumulator);

        var bounding_box = get_bounding_box(input_points);

        var intersections = intersections_from_lines(sorted_lines, bounding_box);
        var accepted_vertix = find_polygon_in_intersections(intersections);

        var poly_error = 0,
            i;

        for (i = 0; i < input_points.length; i++) {
            poly_error += find_polygon_error_for_point(input_points[i], accepted_vertix);
        }

        var intersection1 = get_intersection(input_points[0], sorted_lines[0]);
        var intersection2 = get_intersection(input_points[input_points.length - 1], sorted_lines[0]);

        var line = [intersection1, intersection2];

        var line_error = 0;
        for (i = 0; i < input_points.length; i++) {
            line_error += find_line_error_for_point(input_points[i], line);
        }

        return { 'poly': accepted_vertix, 'poly_error': poly_error, 'line': line, 'line_error': line_error };
    }

    function circle_hough_accumulator(base_points) {
        var min_x = Number.MAX_VALUE;
        var min_y = Number.MAX_VALUE;
        var max_x = 0;
        var max_y = 0;

        var input_points = [],
            i,
            j,
            f,
            p,
            distance,
            px,
            py;
        for (i = 0; i < base_points.length; i++) {
            px = base_points[i].x;
            py = base_points[i].y;

            if (px < min_x) { min_x = px; }
            if (py < min_y) { min_y = py; }
            if (px > max_x) { max_x = px; }
            if (py > max_y) { max_y = py; }

            input_points.push(base_points[i]);
            if (i > 0) {
                var fills = fill_gap_linear(base_points[i-1].x, base_points[i-1].y, base_points[i].x, base_points[i].y);
                for (f = 0; f < fills.length; f++) {
                    input_points.push(fills[f]);
                }
            }
        }

        var center_x = (min_x + max_x) / 2;
        var center_y = (min_y + max_y) / 2;

        // These are to limit the size of the accumulator - the circle needs to be roughly accurate to count
        var min_x_center = center_x - 5;
        var max_x_center = center_x + 5;
        var min_y_center = center_y - 5;
        var max_y_center = center_y + 5;

        var accumulator = [];
        for (i = 0; i < max_x_center - min_x_center; i++) {
            accumulator[i] = [];
            for (j = 0; j < max_y_center - min_y_center; j++) {
                accumulator[i][j] = {};
            }
        }

        for (p = 0; p < input_points.length; p++) {
            px = input_points[p].x;
            py = input_points[p].y;

            for (i = 0; i < max_x_center - min_x_center; i++) {
                var test_x = min_x_center + i;
                for (j = 0; j < max_y_center - min_y_center; j++) {
                    var test_y = min_y_center + j;
                    distance = Math.sqrt(square(px - test_x) + square(py - test_y));
                    distance = Math.floor(distance);
                    if (!accumulator[i][j][distance]) {
                        accumulator[i][j][distance] = 0;
                    }
                    accumulator[i][j][distance]++;
                }
            }
        }

        var best_value = 0;
        var best_match = null;

        for (i = 0; i < max_x_center - min_x_center; i++) {
            for (j = 0; j < max_y_center - min_y_center; j++) {
                var distance_accumulator = accumulator[i][j];
                for (distance in distance_accumulator) {
                    if (distance_accumulator.hasOwnProperty(distance)) {
                        var value = distance_accumulator[distance];
                        if (value > best_value) {
                            best_value = value;
                            best_match = { 'x': min_x_center + i, 'y': min_y_center + j, 'r': distance };
                        }
                    }
                }
            }
        }

        return best_match;
    }


    function find_circle(input_points) {
        var hough_values = circle_hough_accumulator(input_points);

        var cx = hough_values.x;
        var cy = hough_values.y;
        var r = hough_values.r;

        var error = 0;
        var i;

        for (i = 0; i < input_points.length; i++) {
            var ix = input_points[i].x;
            var iy = input_points[i].y;

            var distance = Math.sqrt(square(ix-cx) + square(iy-cy));
            error += square(r - distance);
        }

        hough_values.error = error;
        return hough_values;
    }

    var me = {
        find_shape: function(input_points) {
            var choice = 'none';
            var poly = find_polygon(input_points);
            var circle = find_circle(input_points);
            var circle_area = square(circle.r)*Math.PI;
            var line_length = Math.sqrt(square(poly.line[0].x - poly.line[1].x) + square(poly.line[0].y - poly.line[1].y));

            var min_error = Number.MAX_VALUE;

            if (circle.error < min_error) {
                choice = 'circle';
                min_error = circle.error;
            }
            if (poly.poly_error < min_error) {
                choice = 'polygon';
                min_error = poly.poly_error;
            }
            if (poly.line_error < min_error) {
                choice = 'line';
                min_error = poly.line_error;
            }


            if (choice == 'circle') {
                if (circle.error > (CIRCLE_ERROR_THRESHOLD * circle_area)) {
                    choice = 'bezier';
                }
            }
            if (choice == 'line') {
                if (poly.line_error > (LINE_ERROR_THRESHOLD  * line_length)) {
                    choice = 'bezier';
                }
            }
            if (choice == 'polygon') {
                if (poly.poly.length < 4) {
                    choice = 'bezier';
                }
            }


            var full_info = {
                line: {
                    error: poly.line_error,
                    points: poly.line,
                    length: line_length
                },
                polygon: {
                    error: poly.poly_error,
                    points: poly.poly,
                    area: polygon_area(poly.poly)
                },
                circle: {
                    error: circle.error,
                    // cast to a number
                    radius: +circle.r,
                    cx: circle.x,
                    cy: circle.y,
                    area: circle_area
                }
            };

            return {
                full: full_info,
                best: choice
            };
        }


    };

    return me;
};

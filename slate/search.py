import slate.models

class DBBackend(object):
    def query(self, query_string):
        matching_artboards = slate.models.Artboard.objects.filter(name__icontains = query_string)

        result_data = []

        for artboard in matching_artboards:
            result_data.append({
                'name': artboard.name,
                'url': artboard.get_url(),
            })


        matching_shapes = slate.models.Shape.objects.filter(search_content__icontains = query_string)

        for shape in matching_shapes:
            # multiplying by negative one, because we specify the origin offset, not the pixel value
            # at the physical (0, 0)
            result_data.append({
                'name': shape.artboard.name,
                'url': shape.artboard.get_url_for_position(-1 * shape.search_content_xpos, -1 * shape.search_content_ypos),
                'shape_value': shape.search_content,
            })

        return result_data


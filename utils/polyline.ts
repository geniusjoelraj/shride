/**
 * Decodes an encoded polyline string from Google Maps API into an array of coordinates.
 * @param encoded The encoded polyline string
 * @returns Array of [longitude, latitude] coordinates for GeoJSON
 */
export function decodePolyline(encoded: string): [number, number][] {
    const poly: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
        let b;
        let shift = 0;
        let result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        lng += dlng;

        // GeoJSON expects [longitude, latitude]
        poly.push([lng / 1e5, lat / 1e5]);
    }

    return poly;
}

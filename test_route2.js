require('dotenv').config({ path: '.env' });
const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
const srcLat = 13.0732;
const srcLng = 80.2705;
const dstLat = 12.8231;
const dstLng = 80.0444;
const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${srcLat},${srcLng}&destination=${dstLat},${dstLng}&mode=driving&departure_time=now&key=${apiKey}`;

fetch(url).then(res => res.json()).then(data => {
  if (data.routes && data.routes.length > 0) {
    console.log(data.routes[0].legs[0].duration.text);
    console.log(data.routes[0].legs[0].duration_in_traffic?.text);
  }
});

require('dotenv').config({ path: '.env' });
const apiKey = process.env.EXPO_PUBLIC_MAPS_API_KEY;
const srcLat = 13.1143;
const srcLng = 80.1548;
const dstLat = 12.8231;
const dstLng = 80.0444;
const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${srcLat},${srcLng}&destination=${dstLat},${dstLng}&mode=driving&departure_time=now&key=${apiKey}`;

fetch(url).then(res => res.json()).then(data => {
  if (data.routes && data.routes.length > 0) {
    const leg = data.routes[0].legs[0];
    console.log('Distance:', leg.distance.text);
    console.log('Duration:', leg.duration.text);
    console.log('Duration in Traffic:', leg.duration_in_traffic ? leg.duration_in_traffic.text : 'N/A');
    console.log('Seconds:', leg.duration.value);
    
    // Test formatting logic
    let seconds = leg.duration.value;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    console.log('Formatted:', h > 0 ? `${h}h ${m}m` : `${m}m`);
  } else {
    console.log('No routes found', data.status);
  }
}).catch(console.error);

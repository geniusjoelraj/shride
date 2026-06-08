const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    const { data, error } = await supabase.from('rides').select('route_geom').not('route_geom', 'is', null).limit(1);
    if (data && data.length > 0) {
        console.log(typeof data[0]?.route_geom);
        console.log(data[0]?.route_geom);
    } else {
        console.log('No rides with route_geom');
    }
})();

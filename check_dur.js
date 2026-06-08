const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
(async () => {
    const { data } = await supabase.from('rides').select('estimated_duration, source_name');
    console.log(data);
})();

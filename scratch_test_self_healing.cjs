const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function safeWrite(tableName, payload, matchField = 'id') {
  try {
    const cleanPayload = { ...payload };
    const { error } = await supabase
      .from(tableName)
      .upsert(cleanPayload, { onConflict: matchField });
    if (error) {
      const errMsg = error.message || '';
      if (errMsg.includes('column') || errMsg.includes('schema cache')) {
        const matches = errMsg.match(/['"]([a-zA-Z0-9_]+)['"]/g);
        if (matches) {
          const words = matches.map(m => m.replace(/['"]/g, ''));
          const columnName = words.find(w => w !== tableName && w !== 'id');
          if (columnName) {
            console.warn(`Retrying ${tableName} upsert after removing missing column: ${columnName}`);
            delete cleanPayload[columnName];
            const retryResult = await supabase
              .from(tableName)
              .upsert(cleanPayload, { onConflict: matchField });
            if (retryResult.error) {
              console.error("Retry failed:", retryResult.error.message);
              return false;
            }
            console.log("Retry succeeded!");
            return true;
          }
        }
      }
      console.error(`Supabase write status on ${tableName}:`, error.message);
      return false;
    }
    console.log("Upsert succeeded first try!");
    return true;
  } catch (err) {
    console.error("Exception:", err);
    return false;
  }
}

async function test() {
  await safeWrite('businesses', {
    id: 'test-bu-2',
    name: 'Self Healing Business',
    category: 'Restaurants',
    status: 'Pending'
  });
}

test();

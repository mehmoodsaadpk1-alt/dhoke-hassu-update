
import { supabase } from './src/utils/supabaseClient';

async function test() {
  console.log('Testing join group...');
  const { error } = await supabase.from('group_members').insert({
    group_id: 'test-group',
    user_id: 'test-user',
    role: 'member',
    status: 'active'
  });
  console.log('Error from group_members:', JSON.stringify(error, null, 2));

  const { data } = await supabase.from('groups').select('*').limit(1);
  console.log('Groups table exists, first row:', JSON.stringify(data, null, 2));
}
test();


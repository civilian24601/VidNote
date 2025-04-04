
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const userId = '21f1184b-7c39-4e6e-a6f7-45ad891fa9a7';

// Initialize Supabase admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkUserAndRLS() {
  console.log('🔍 Checking user record and RLS policies...\n');

  // 1. Check if user exists (using admin client to bypass RLS)
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  console.log('User record check:');
  if (userData) {
    console.log('✅ User found:', {
      id: userData.id,
      email: userData.email,
      username: userData.username
    });
  } else {
    console.log('❌ User not found');
    console.log('Error:', userError);
  }

  // 2. Check RLS policies
  const { data: policies, error: policyError } = await supabaseAdmin
    .rpc('get_policies', { table_name: 'users' });

  console.log('\nRLS policies check:');
  if (policies) {
    const selectPolicies = policies.filter(p => 
      p.operation === 'SELECT' && 
      p.definition.includes('auth.uid() = id')
    );
    
    if (selectPolicies.length > 0) {
      console.log('✅ Found SELECT policy for users table:');
      selectPolicies.forEach(p => {
        console.log(`- ${p.name}: ${p.definition}`);
      });
    } else {
      console.log('❌ No appropriate SELECT policy found');
      console.log('Required policy should be similar to:');
      console.log('CREATE POLICY "Users can view self" ON users FOR SELECT USING (auth.uid() = id);');
    }
  } else {
    console.log('❌ Failed to fetch policies');
    console.log('Error:', policyError);
  }
}

checkUserAndRLS().catch(console.error);

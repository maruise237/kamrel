const { createClient } = require('@supabase/supabase-js');

// Utiliser les mêmes variables que votre application
const supabaseUrl = 'https://xnwjvajlttmgwqnvpyqg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhud2p2YWpsdHRtZ3dxbnZweXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMzkwODIsImV4cCI6MjA2NzgxNTA4Mn0.h8969GZd7BKQe7CVdmL4MqIZB0_E1HyiTuTC0i03m-c';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test simple de connexion
    const { data, error } = await supabase.from('teams').select('count').limit(1);
    
    if (error) {
      console.error('❌ Supabase connection error:', error);
      console.error('Error details:', error.message);
      console.error('Error code:', error.code);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('Data:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
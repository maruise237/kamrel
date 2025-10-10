const { createClient } = require('@supabase/supabase-js');

// Utiliser les mêmes variables que votre application
const supabaseUrl = 'https://qyrrwjneeolzcayqdsur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5cnJ3am5lZW9semNheXFkc3VyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDA4NDAsImV4cCI6MjA3NDQxNjg0MH0.fJNzKlTO5agqCHb1AC9QqOxp28qARzsSs3822e9w7GU';

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
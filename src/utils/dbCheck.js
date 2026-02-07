// src/utils/dbCheck.js
import { supabase } from '../config/supabase';

export const checkDatabaseTables = async () => {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check if users table exists
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    console.log('📊 Users table check:', usersError ? 'Missing' : 'Exists');
    
    // Check if verification_codes table exists
    const { data: codesData, error: codesError } = await supabase
      .from('verification_codes')
      .select('count', { count: 'exact', head: true })
      .limit(1);
    
    console.log('📊 Verification codes table check:', codesError ? 'Missing' : 'Exists');
    
    return {
      usersTable: !usersError,
      verificationCodesTable: !codesError
    };
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return {
      usersTable: false,
      verificationCodesTable: false
    };
  }
};

// Call this in your App.js or index.js
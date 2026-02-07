import { supabase } from '../config/supabase';

export const setupAdminUser = async () => {
  try {
    console.log('Setting up admin user...');
    
    const { data, error } = await supabase.auth.signUp({
      email: 'cartadaniel01@gmail.com',
      password: 'Adjeimensah1234@',
      options: {
        data: {
          role: 'admin',
          firstName: 'Daniel',
          lastName: 'Adjei Mensah'
        }
      }
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        console.log('Admin user already exists');
        return { success: true, message: 'Admin user already exists' };
      }
      console.error('Error creating admin user:', error);
      return { success: false, error };
    }

    console.log('Admin user created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in setupAdminUser:', error);
    return { success: false, error };
  }
};

// Run this function once to create the admin user
// setupAdminUser();
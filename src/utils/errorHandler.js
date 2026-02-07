export const handleSupabaseError = (error, fallbackMessage = 'An error occurred') => {
  console.error('Supabase Error:', error);
  
  if (error.code === 'PGRST116') return 'Item not found';
  if (error.code === '23505') return 'Item already exists';
  
  return error.message || fallbackMessage;
};
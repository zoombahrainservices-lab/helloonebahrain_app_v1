import { getSupabase } from './supabase';

/**
 * Ensure user exists in the users table
 * This is needed because orders table has a foreign key to users table
 * but Supabase Auth users are in auth.users, not in the users table
 */
export async function ensureUserExists(userId: string, email?: string, name?: string): Promise<void> {
  const supabase = getSupabase();

  // Check if user already exists
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    // PGRST116 is "not found" which is fine, other errors are not
    if (__DEV__) {
      console.error('Error checking user existence:', checkError);
    }
  }

  // If user doesn't exist, create them
  if (!existingUser) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email || '',
        name: name || 'User',
        role: 'user',
      });

    if (insertError) {
      // If insert fails due to conflict (user was created between check and insert), that's okay
      if (insertError.code !== '23505') { // 23505 is unique violation
        if (__DEV__) {
          console.error('Error creating user in users table:', insertError);
        }
        throw new Error(`Failed to create user: ${insertError.message}`);
      }
    } else {
      if (__DEV__) {
        console.log('✅ User created in users table');
      }
    }
  } else {
    // User exists, but update email/name if provided and different
    if (email || name) {
      const updateData: any = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name;

      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      if (updateError && __DEV__) {
        console.error('Error updating user:', updateError);
      }
    }
  }
}


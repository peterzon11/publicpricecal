import { supabase } from '../lib/supabase';

// ล้างข้อมูลใน localStorage
localStorage.clear();
console.log('Cleared all localStorage data');

// ล้างข้อมูลใน Supabase
async function clearSupabaseData() {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .neq('id', 0); // ลบทุกแถว

    if (error) throw error;
    console.log('Cleared all Supabase data');
  } catch (error) {
    console.error('Error clearing Supabase data:', error);
  }
}

// รันฟังก์ชัน
clearSupabaseData(); 
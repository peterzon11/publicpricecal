import { supabase } from './supabase'

// ตัวอย่างฟังก์ชันดึงข้อมูล
export async function fetchSubscriptions() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
  
  if (error) throw error
  return data
}

// ตัวอย่างฟังก์ชันเพิ่มข้อมูล
export async function addSubscription(subscription: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .insert([subscription])
    .select()
  
  if (error) throw error
  return data
}

// ตัวอย่างฟังก์ชันอัพเดทข้อมูล
export async function updateSubscription(id: number, updates: any) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data
}

// ตัวอย่างฟังก์ชันลบข้อมูล
export async function deleteSubscription(id: number) {
  const { error } = await supabase
    .from('subscriptions')
    .delete()
    .eq('id', id)
  
  if (error) throw error
} 
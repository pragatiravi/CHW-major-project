import { supabase, isSupabaseConfigured } from '../supabaseClient';

const LOCAL_INVENTORY_KEY = 'chw_inventory_stock';

function getLocalInventory() {
  try {
    const raw = localStorage.getItem(LOCAL_INVENTORY_KEY);
    return raw ? JSON.parse(raw) : [
      { id: 'INV-01', itemName: 'Blood Glucose Test Strips (Accu-Chek)', category: 'Diagnostic Strip', quantity: 120, unit: 'strips', reorderLevel: 50, subcenter: 'Vimanapura Subcenter' },
      { id: 'INV-02', itemName: 'Amlodipine 5mg Tablets', category: 'Medication', quantity: 450, unit: 'tablets', reorderLevel: 100, subcenter: 'Vimanapura Subcenter' },
      { id: 'INV-03', itemName: 'Metformin 500mg Tablets', category: 'Medication', quantity: 380, unit: 'tablets', reorderLevel: 100, subcenter: 'Vimanapura Subcenter' },
      { id: 'INV-04', itemName: 'Digital Sphygmomanometer BP Cuffs', category: 'Device', quantity: 4, unit: 'units', reorderLevel: 2, subcenter: 'Vimanapura Subcenter' },
      { id: 'INV-05', itemName: 'Sterile Alcohol Swabs', category: 'First Aid', quantity: 600, unit: 'swabs', reorderLevel: 150, subcenter: 'Vimanapura Subcenter' }
    ];
  } catch {
    return [];
  }
}

export async function fetchInventory() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name');

      if (!error && data) {
        return data.map(item => ({
          id: item.id,
          itemName: item.item_name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          reorderLevel: item.reorder_level,
          subcenter: item.subcenter
        }));
      }
    } catch (err) {
      console.warn('Supabase fetchInventory error:', err);
    }
  }

  return getLocalInventory();
}

export async function updateInventoryItem(itemId, newQuantity) {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('inventory')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', itemId);
    } catch (err) {
      console.warn('Supabase updateInventoryItem error:', err);
    }
  }

  const current = getLocalInventory();
  const updated = current.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item);
  try {
    localStorage.setItem(LOCAL_INVENTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update inventory locally:', e);
  }
  return updated;
}

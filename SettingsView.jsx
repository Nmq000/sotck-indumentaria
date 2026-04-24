import { createClient } from '@supabase/supabase-js'

const url  = import.meta.env.VITE_SUPABASE_URL
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('⚠ Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env')
}

export const supabase = createClient(url, key)

// ── Auth ──────────────────────────────────────────────────────

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () =>
  supabase.auth.signOut()

export const getRole = async (userId) => {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()
  return data?.role ?? null
}

// ── Inventario ────────────────────────────────────────────────

export const getInventario = async () => {
  const { data, error } = await supabase
    .from('inventario')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// Upsert usando la función SQL (suma si existe, crea si no)
export const upsertStock = async (fields) => {
  const { data, error } = await supabase.rpc('upsert_inventario', {
    p_tipo:      fields.tipo,
    p_tela:      fields.tela,
    p_color:     fields.color,
    p_talle:     fields.talle,
    p_estampa:   fields.estampa,
    p_cantidad:  parseInt(fields.cantidad) || 1,
    p_precio:    parseFloat(fields.precio) || 0,
    p_ubicacion: fields.ubicacion || null,
  })
  if (error) throw error
  return data  // { record, is_new }
}

export const updateProducto = async (id, updates) => {
  const { data, error } = await supabase
    .from('inventario')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteProducto = async (id) => {
  const { error } = await supabase
    .from('inventario')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ── Tablas maestras ───────────────────────────────────────────

const masterTable = (name) => ({
  getAll: async () => {
    const { data, error } = await supabase.from(name).select('*').order('nombre')
    if (error) throw error
    return data
  },
  insert: async (nombre) => {
    const { data, error } = await supabase.from(name).insert({ nombre }).select().single()
    if (error) throw error
    return data
  },
  delete: async (id) => {
    const { error } = await supabase.from(name).delete().eq('id', id)
    if (error) throw error
  },
})

export const db = {
  tipos:      masterTable('tipos'),
  telas:      masterTable('telas'),
  colores:    masterTable('colores'),
  talles:     masterTable('talles'),
  ubicaciones:masterTable('ubicaciones'),

  getConfig: async () => {
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 1)
      .single()
    if (error) throw error
    return data
  },

  updateConfig: async (updates) => {
    const { data, error } = await supabase
      .from('configuracion')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single()
    if (error) throw error
    return data
  },
}

// ── Realtime ──────────────────────────────────────────────────
// Suscripción a cambios en inventario (para múltiples usuarios)
export const subscribeInventario = (callback) =>
  supabase
    .channel('inventario-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, callback)
    .subscribe()

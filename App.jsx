-- ============================================================
-- STOCK INDUMENTARIA — Schema Supabase
-- Ejecutar en: Supabase → SQL Editor → New query
-- ============================================================

-- ── 1. EXTENSIONES ──────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 2. TABLAS MAESTRAS ──────────────────────────────────────

create table tipos (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  created_at timestamptz default now()
);

create table telas (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  created_at timestamptz default now()
);

create table colores (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  created_at timestamptz default now()
);

create table talles (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  orden int default 0,
  created_at timestamptz default now()
);

create table ubicaciones (
  id uuid primary key default uuid_generate_v4(),
  nombre text not null unique,
  created_at timestamptz default now()
);

-- ── 3. CONFIGURACIÓN GLOBAL ──────────────────────────────────
create table configuracion (
  id int primary key default 1 check (id = 1), -- singleton
  dias_clavo int not null default 60,
  stock_minimo int not null default 5,
  google_vision_key text default '',
  updated_at timestamptz default now()
);
insert into configuracion (id) values (1) on conflict do nothing;

-- ── 4. ROLES DE USUARIO ──────────────────────────────────────
create table user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operario')),
  created_at timestamptz default now(),
  unique (user_id)
);

-- Función has_role (security definer para bypassear RLS)
create or replace function has_role(check_role text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from user_roles
    where user_id = auth.uid()
    and role = check_role
  );
end;
$$;

-- ── 5. INVENTARIO ────────────────────────────────────────────
create table inventario (
  id uuid primary key default uuid_generate_v4(),

  -- Atributos principales
  tipo text not null,
  tela text not null,
  color text not null,
  talle text not null,
  estampa boolean not null default false,

  -- Stock y precio
  cantidad int not null default 0 check (cantidad >= 0),
  precio numeric(10,2) not null default 0,
  ubicacion text,

  -- Timestamps
  fecha_ingreso date not null default current_date,
  ultima_venta date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- REGLA DE ORO: combinación única de atributos
  constraint inventario_unique_combo unique (tipo, tela, color, talle, estampa)
);

-- Índices para búsquedas frecuentes
create index idx_inventario_tipo on inventario(tipo);
create index idx_inventario_cantidad on inventario(cantidad);
create index idx_inventario_ultima_venta on inventario(ultima_venta);

-- Trigger: actualizar updated_at automáticamente
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger inventario_updated_at
  before update on inventario
  for each row execute function update_updated_at();

-- ── 6. MOVIMIENTOS (historial de cambios) ────────────────────
create table movimientos (
  id uuid primary key default uuid_generate_v4(),
  inventario_id uuid not null references inventario(id) on delete cascade,
  user_id uuid references auth.users(id),
  tipo_movimiento text not null check (tipo_movimiento in ('ingreso', 'egreso', 'ajuste')),
  cantidad_delta int not null, -- positivo = ingreso, negativo = egreso
  cantidad_anterior int not null,
  cantidad_nueva int not null,
  motivo text,
  created_at timestamptz default now()
);

create index idx_movimientos_inventario on movimientos(inventario_id);
create index idx_movimientos_fecha on movimientos(created_at);

-- ── 7. FUNCIÓN UPSERT (Regla de Oro) ─────────────────────────
-- Llama a esta función en lugar de INSERT directo.
-- Si la combinación existe: suma cantidad y devuelve el registro actualizado.
-- Si no existe: crea uno nuevo.
create or replace function upsert_inventario(
  p_tipo text,
  p_tela text,
  p_color text,
  p_talle text,
  p_estampa boolean,
  p_cantidad int,
  p_precio numeric,
  p_ubicacion text
)
returns json
language plpgsql
security definer
as $$
declare
  existing_record inventario%rowtype;
  result_record inventario%rowtype;
  is_new boolean := false;
begin
  -- Buscar si ya existe
  select * into existing_record
  from inventario
  where tipo = p_tipo and tela = p_tela and color = p_color
    and talle = p_talle and estampa = p_estampa;

  if found then
    -- Existe → sumar cantidad
    update inventario
    set cantidad = cantidad + p_cantidad,
        precio = p_precio,
        ubicacion = coalesce(p_ubicacion, ubicacion)
    where id = existing_record.id
    returning * into result_record;

    -- Registrar movimiento
    insert into movimientos (inventario_id, user_id, tipo_movimiento, cantidad_delta, cantidad_anterior, cantidad_nueva)
    values (result_record.id, auth.uid(), 'ingreso', p_cantidad, existing_record.cantidad, result_record.cantidad);

  else
    -- No existe → crear nuevo
    insert into inventario (tipo, tela, color, talle, estampa, cantidad, precio, ubicacion)
    values (p_tipo, p_tela, p_color, p_talle, p_estampa, p_cantidad, p_precio, p_ubicacion)
    returning * into result_record;

    is_new := true;

    -- Registrar movimiento
    insert into movimientos (inventario_id, user_id, tipo_movimiento, cantidad_delta, cantidad_anterior, cantidad_nueva)
    values (result_record.id, auth.uid(), 'ingreso', p_cantidad, 0, p_cantidad);
  end if;

  return json_build_object(
    'record', row_to_json(result_record),
    'is_new', is_new
  );
end;
$$;

-- ── 8. ROW LEVEL SECURITY ────────────────────────────────────

-- Inventario: todos leen, operario y admin escriben
alter table inventario enable row level security;
create policy "inventario_select" on inventario for select to authenticated using (true);
create policy "inventario_insert" on inventario for insert to authenticated with check (true);
create policy "inventario_update" on inventario for update to authenticated using (true);
create policy "inventario_delete" on inventario for delete to authenticated using (has_role('admin'));

-- Tablas maestras: todos leen, solo admin escribe
alter table tipos enable row level security;
create policy "tipos_select" on tipos for select to authenticated using (true);
create policy "tipos_write" on tipos for all to authenticated using (has_role('admin'));

alter table telas enable row level security;
create policy "telas_select" on telas for select to authenticated using (true);
create policy "telas_write" on telas for all to authenticated using (has_role('admin'));

alter table colores enable row level security;
create policy "colores_select" on colores for select to authenticated using (true);
create policy "colores_write" on colores for all to authenticated using (has_role('admin'));

alter table talles enable row level security;
create policy "talles_select" on talles for select to authenticated using (true);
create policy "talles_write" on talles for all to authenticated using (has_role('admin'));

alter table ubicaciones enable row level security;
create policy "ubicaciones_select" on ubicaciones for select to authenticated using (true);
create policy "ubicaciones_write" on ubicaciones for all to authenticated using (has_role('admin'));

-- Configuración: todos leen, solo admin escribe
alter table configuracion enable row level security;
create policy "config_select" on configuracion for select to authenticated using (true);
create policy "config_write" on configuracion for update to authenticated using (has_role('admin'));

-- User roles: solo el propio usuario y admin
alter table user_roles enable row level security;
create policy "user_roles_select" on user_roles for select to authenticated using (user_id = auth.uid() or has_role('admin'));
create policy "user_roles_write" on user_roles for all to authenticated using (has_role('admin'));

-- Movimientos: solo lectura para autenticados
alter table movimientos enable row level security;
create policy "movimientos_select" on movimientos for select to authenticated using (true);
create policy "movimientos_insert" on movimientos for insert to authenticated with check (true);

-- ── 9. DATOS INICIALES (tablas maestras) ─────────────────────
insert into tipos (nombre) values ('Remera'),('Pantalón'),('Buzo'),('Vestido'),('Campera'),('Short'),('Calza') on conflict do nothing;
insert into telas (nombre) values ('Algodón'),('Jean'),('Polar'),('Modal'),('Lycra'),('Nylon'),('Lino'),('Seda') on conflict do nothing;
insert into colores (nombre) values ('Blanco'),('Negro'),('Azul'),('Rojo'),('Gris'),('Verde'),('Beige'),('Rosa'),('Amarillo') on conflict do nothing;
insert into talles (nombre, orden) values ('XS',1),('S',2),('M',3),('L',4),('XL',5),('XXL',6),('Único',7),('38',8),('40',9),('42',10),('44',11),('46',12) on conflict do nothing;
insert into ubicaciones (nombre) values ('Depósito Principal'),('Depósito 2'),('Local Frente'),('Local Fondo'),('Online') on conflict do nothing;

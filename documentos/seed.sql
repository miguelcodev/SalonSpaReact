-- ============================================================
-- Bellamora — Seed data de ejemplo
-- Usa los mismos datos que los prototipos HTML (Agenda, CRM,
-- Catálogo, Promociones, WhatsApp) para poder probar todo junto.
-- Ejecutar después de schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. SALÓN
-- ------------------------------------------------------------
insert into salons (id, name, whatsapp_number, plan) values
('a0000000-0000-0000-0000-000000000001', 'Bellamora', '+51999888777', 'pro');

-- ------------------------------------------------------------
-- 2. ESPECIALISTAS
-- ------------------------------------------------------------
insert into staff (id, salon_id, name, level, color_hex) values
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Renata',   'senior', '#C77B4B'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Andrea',   'junior', '#E0A87A'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Milagros', 'senior', '#B8697A'),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Fabiola',  'senior', '#7C9070'),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Sofía',    'senior', '#8D7B9E');

-- ------------------------------------------------------------
-- 3. CATEGORÍAS Y SERVICIOS
-- ------------------------------------------------------------
insert into service_categories (id, salon_id, name, color_hex) values
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Cabello',    '#C77B4B'),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Uñas',       '#B8697A'),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Facial',     '#7C9070'),
('c0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Maquillaje', '#8D7B9E');

insert into services (id, salon_id, category_id, name, description, duration_minutes, buffer_minutes, status) values
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Corte + Balayage',  'Corte a medida con mechas balayage',       90, 10, 'activo'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Corte de puntas',   'Corte simple de mantenimiento',            30, 5,  'activo'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'Retoque de color',  'Aplicación de color en raíz',              75, 10, 'activo'),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Uñas gel + diseño', 'Esmaltado permanente con diseño',          60, 5,  'activo'),
('d0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Manicure express',  'Esmaltado tradicional rápido',             30, 5,  'activo'),
('d0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'Pedicure spa',      'Exfoliación, masaje y esmaltado',          50, 10, 'pausado'),
('d0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Facial hidratante', 'Limpieza + mascarilla hidratante',         60, 10, 'activo'),
('d0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'Limpieza profunda', 'Extracción y desincrustación',             55, 10, 'activo'),
('d0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Maquillaje social', 'Para eventos y fiestas',                   60, 5,  'activo'),
('d0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000004', 'Maquillaje express','Look natural para el día a día',           30, 5,  'activo');

-- Precio por especialista (los servicios de cabello tienen 2 precios: senior/junior)
insert into service_staff_prices (service_id, staff_id, price_cents) values
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 18000), -- Corte+Balayage con Renata: S/180
('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 14000), -- con Andrea: S/140
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 4500),
('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 3500),
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 12000),
('d0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 9500),
('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003', 7000),
('d0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 3500),
('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000003', 6500),
('d0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004', 12000),
('d0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004', 9500),
('d0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005', 15000),
('d0000000-0000-0000-0000-000000000010','b0000000-0000-0000-0000-000000000005', 6000);

-- ------------------------------------------------------------
-- 4. COMBOS
-- ------------------------------------------------------------
insert into combos (id, salon_id, name, combined_price_cents) values
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Combo Novia',   16500),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Combo Renueva', 22500),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Combo Exprés',   8500);

insert into combo_services (combo_id, service_id) values
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002'), -- Corte de puntas
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000009'), -- Maquillaje social
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003'), -- Retoque de color
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000007'), -- Facial hidratante
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000005'), -- Manicure express
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000010'); -- Maquillaje express

-- ------------------------------------------------------------
-- 5. CLIENTES
-- ------------------------------------------------------------
insert into clients (id, salon_id, name, phone, email, birth_date, preferences, visit_count, total_spent_cents, last_visit_at) values
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Camila Rojas',  '+51987654321', 'camila.rojas@mail.com',  '1994-03-12', 'Alérgica a amoniaco, usar tinte orgánico. Prefiere café antes de iniciar.', 14, 234000, now() - interval '3 days'),
('f0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Lucía Prado',   '+51976112340', 'lucia.prado@mail.com',   '1998-07-28', 'Le gusta el tono rosa nude, a veces trae su propio esmalte.',              9,  98000,  now() - interval '7 days'),
('f0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Valeria Soto',  '+51955220118', 'valeria.soto@mail.com',  '1996-11-02', 'Piel sensible, evitar productos con fragancia.',                            5,  61000,  now() - interval '2 days'),
('f0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Daniela Cruz',  '+51944887220', 'daniela.cruz@mail.com',  '1992-05-19', 'Eventos frecuentes, prefiere acabado mate de larga duración.',             11, 154000, now()),
('f0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Grecia Núñez',  '+51933441902', 'grecia.nunez@mail.com',  '2000-09-30', 'Cliente frecuente los sábados, siempre puntual.',                           3,  21000,  now() - interval '4 days'),
('f0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Ximena Ríos',   '+51922774501', 'ximena.rios@mail.com',   '1995-07-20', 'Cumpleaños esta semana. Ofrecer cupón de fidelidad en la próxima visita.',  6,  72000,  now() - interval '21 days'),
('f0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Ana Beltrán',   '+51911220875', 'ana.beltran@mail.com',   '1999-01-15', 'Primera visita referida por Camila Rojas. Candidata a reactivación.',      1,  4500,   now() - interval '68 days'),
('f0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Noelia Vidal',  '+51988112233', 'noelia.vidal@mail.com',  '1993-02-08', 'Boda el mes próximo, agenda combo de corte + maquillaje.',                 2,  18500,  now()),
('f0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Rosa Medina',   '+51966554433', 'rosa.medina@mail.com',   '1997-04-22', 'Sesión de fotos ocasional, prefiere tonos naturales de maquillaje.',       4,  38000,  now() - interval '10 days');

-- ------------------------------------------------------------
-- 6. CITAS (fecha base: jueves 16 de julio 2026, como en el prototipo)
-- Se desactiva trg_update_client_stats durante el seed: las clientas de la
-- sección 5 ya traen visit_count/total_spent finales; el trigger las
-- incrementaría de nuevo al insertar las citas 'completada'.
-- ------------------------------------------------------------
alter table appointments disable trigger trg_update_client_stats;

insert into appointments
  (id, salon_id, client_id, service_id, staff_id, combo_group_id, start_time, end_time, buffer_minutes, duration_minutes, price_cents, status, notes) values

-- Camila Rojas — Corte + Balayage con Renata, 9:00–10:30 (+10 min buffer)
('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
 null, '2026-07-16 09:00:00-05', '2026-07-16 10:30:00-05', 10, 90, 18000, 'confirmada',
 'Alérgica a amoniaco, usar tinte orgánico.'),

-- Ana Beltrán — Corte de puntas con Renata, 11:00–11:30
('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 null, '2026-07-16 11:00:00-05', '2026-07-16 11:30:00-05', 5, 30, 4500, 'pendiente',
 'Primera visita, referida por Camila Rojas.'),

-- Lucía Prado — Uñas gel + diseño con Milagros, 10:00–11:00
('10000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000003',
 null, '2026-07-16 10:00:00-05', '2026-07-16 11:00:00-05', 5, 60, 7000, 'confirmada', null),

-- Grecia Núñez — Manicure express con Milagros, 14:00–14:30
('10000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
 null, '2026-07-16 14:00:00-05', '2026-07-16 14:30:00-05', 5, 30, 3500, 'confirmada', null),

-- Valeria Soto — Facial hidratante con Fabiola, 9:00–10:00
('10000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000004',
 null, '2026-07-16 09:00:00-05', '2026-07-16 10:00:00-05', 10, 60, 12000, 'pendiente',
 'Piel sensible, evitar productos con fragancia.'),

-- Ximena Ríos — Limpieza profunda con Fabiola, 15:00–16:00
('10000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004',
 null, '2026-07-16 15:00:00-05', '2026-07-16 16:00:00-05', 10, 55, 9500, 'confirmada', null),

-- Daniela Cruz — Maquillaje social con Sofía, 12:00–13:00
('10000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005',
 null, '2026-07-16 12:00:00-05', '2026-07-16 13:00:00-05', 5, 60, 15000, 'confirmada',
 'Evento en la noche, acabado mate de larga duración.'),

-- Rosa Medina — Maquillaje express con Sofía, 16:00–16:30
('10000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005',
 null, '2026-07-16 16:00:00-05', '2026-07-16 16:30:00-05', 5, 30, 6000, 'pendiente',
 'Sesión de fotos, prefiere tonos naturales.'),

-- Combo Novia — Noelia Vidal, 17:00, corte (Andrea) + maquillaje (Sofía) en paralelo
('10000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002',
 '90000000-0000-0000-0000-000000000001', '2026-07-16 17:00:00-05', '2026-07-16 17:30:00-05', 5, 30, 3500, 'confirmada',
 'Combo Novia — coordinado con maquillaje (Sofía) a la misma hora.'),

('10000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000005',
 '90000000-0000-0000-0000-000000000001', '2026-07-16 17:00:00-05', '2026-07-16 18:00:00-05', 5, 60, 15000, 'confirmada',
 'Combo Novia — coordinado con corte (Andrea) a la misma hora.'),

-- Citas completadas en semanas anteriores, para poblar las vistas de reportes
('10000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001',
 null, '2026-07-02 10:00:00-05', '2026-07-02 11:15:00-05', 10, 75, 12000, 'completada', null),

('10000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003',
 null, '2026-06-11 11:00:00-05', '2026-06-11 11:30:00-05', 5, 30, 3500, 'completada', null),

('10000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000004',
 null, '2026-05-20 09:00:00-05', '2026-05-20 09:55:00-05', 10, 55, 9500, 'completada', null),

('10000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000005',
 null, '2026-07-02 15:00:00-05', '2026-07-02 15:30:00-05', 5, 30, 6000, 'completada', null),

('10000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000001',
 'f0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001',
 null, '2026-05-09 10:00:00-05', '2026-05-09 10:30:00-05', 5, 30, 4500, 'completada',
 'Primera visita, referida por Camila Rojas.');

alter table appointments enable trigger trg_update_client_stats;

-- ------------------------------------------------------------
-- 7. PAGOS (para las citas completadas)
-- ------------------------------------------------------------
insert into payments (appointment_id, amount_cents, method, status, paid_at) values
('10000000-0000-0000-0000-000000000011', 12000, 'stripe',   'pagado', '2026-07-02 11:15:00-05'),
('10000000-0000-0000-0000-000000000012', 3500,  'efectivo', 'pagado', '2026-06-11 11:30:00-05'),
('10000000-0000-0000-0000-000000000013', 9500,  'yape',     'pagado', '2026-05-20 09:55:00-05'),
('10000000-0000-0000-0000-000000000014', 6000,  'efectivo', 'pagado', '2026-07-02 15:30:00-05'),
('10000000-0000-0000-0000-000000000015', 4500,  'yape',     'pagado', '2026-05-09 10:30:00-05');

-- ------------------------------------------------------------
-- 8. PROMOCIONES
-- El estado (activa/programada/vencida) NO se inserta: lo deriva
-- view_promotions_with_status a partir de las fechas y el límite de usos.
-- discount_value en 'fixed' está en CENTAVOS (15000 = S/150).
-- ------------------------------------------------------------
insert into promotions (id, salon_id, name, category_id, discount_type, discount_value, valid_from, valid_to, usage_limit, usage_count, send_whatsapp) values
('20000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Miércoles de uñas',       'c0000000-0000-0000-0000-000000000002', 'percent', 20,    '2026-07-01', '2026-07-31', 100, 64, true),  -- activa
('20000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Primera visita cabello',  'c0000000-0000-0000-0000-000000000001', 'percent', 15,    null,         null,         50,  12, true),  -- activa
('20000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ritual de primavera',     'c0000000-0000-0000-0000-000000000003', 'fixed',   15000, '2026-08-01', '2026-08-31', 40,  0,  true),  -- programada (S/150 de dscto)
('20000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Cumpleañeras del mes',    null,                                     'percent', 25,    null,         null,         null, 8, true),  -- activa
('20000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Balayage de verano',      'c0000000-0000-0000-0000-000000000001', 'percent', 18,    '2026-06-01', '2026-06-30', 44,  44, true);  -- vencida

-- ------------------------------------------------------------
-- 9. PROGRAMA DE FIDELIDAD
-- ------------------------------------------------------------
insert into loyalty_programs (id, salon_id, visits_required, reward_description) values
('30000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 6, '25% de descuento en el siguiente servicio');

insert into loyalty_progress (client_id, program_id, stamps, last_stamp_at) values
('f0000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 4, now() - interval '3 days');

-- ------------------------------------------------------------
-- 10. REGLAS DE AUTOMATIZACIÓN (WhatsApp)
-- ------------------------------------------------------------
insert into automation_rules (salon_id, type, enabled, template_text, offset_minutes) values
('a0000000-0000-0000-0000-000000000001', 'confirmacion',      true,  'Hola {nombre} 🌸 Tu cita de {servicio} quedó confirmada para el {fecha} a las {hora} con {especialista}. ¡Te esperamos en Bellamora!', 0),
('a0000000-0000-0000-0000-000000000001', 'recordatorio_24h',  true,  '¡Hola {nombre}! Te recordamos tu cita de {servicio} mañana {fecha} a las {hora}. Responde CONFIRMAR o CANCELAR.', -1440),
('a0000000-0000-0000-0000-000000000001', 'recordatorio_2h',   true,  '{nombre}, tu cita es en 2 horas ⏳ Te esperamos en Bellamora.', -120),
('a0000000-0000-0000-0000-000000000001', 'resena',            true,  'Gracias por visitarnos, {nombre} 💕 ¿Nos regalas una reseña de tu experiencia hoy?', 120),
('a0000000-0000-0000-0000-000000000001', 'reactivacion',      false, 'Te extrañamos, {nombre} 🌷 Vuelve esta semana y llévate 15% de descuento en tu próximo servicio.', null),
('a0000000-0000-0000-0000-000000000001', 'cumpleanos',        true,  '¡Feliz cumpleaños, {nombre}! 🎉 Tienes 25% de descuento en cualquier servicio este mes.', null);

-- ------------------------------------------------------------
-- 11. MENSAJES WHATSAPP (bandeja de ejemplo)
-- ------------------------------------------------------------
insert into whatsapp_messages (salon_id, client_id, appointment_id, direction, rule_type, body, status, sent_at) values
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'outbound', 'recordatorio_24h', 'Te recordamos tu cita de Corte + Balayage mañana a las 9:00 am. Responde CONFIRMAR o CANCELAR.', 'leido', now() - interval '1 day'),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'inbound',  null,               'CONFIRMAR 👍', 'leido', now() - interval '23 hours'),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', 'inbound',  null,               '¿Puedo cambiar mi cita al viernes?', 'entregado', now() - interval '5 hours'),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', null,                                   'inbound',  null,               'Gracias, quedó hermoso 😍', 'leido', now() - interval '1 day'),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000004', null,                                   'inbound',  null,               '⭐⭐⭐⭐⭐ Excelente atención', 'leido', now() - interval '1 day'),
('a0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000007', null,                                   'inbound',  null,               'CANCELAR, surgió un imprevisto', 'leido', now() - interval '4 days');

-- ============================================================
-- Verificación rápida tras correr el seed:
--   select * from view_revenue_by_week where salon_id = 'a0000000-0000-0000-0000-000000000001';
--   select * from view_top_services   where salon_id = 'a0000000-0000-0000-0000-000000000001';
--   select * from view_client_segments where salon_id = 'a0000000-0000-0000-0000-000000000001';
--   select name, status from view_promotions_with_status where salon_id = 'a0000000-0000-0000-0000-000000000001';
--     (esperado: 3 activas, 1 programada, 1 vencida)
-- ============================================================

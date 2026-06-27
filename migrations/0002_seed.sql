-- Demo seed data

INSERT OR IGNORE INTO properties (id, name, address, type, status) VALUES
  ('prop-001', 'Sunset Apartments', '12 Main Road, Johannesburg', 'residential', 'active'),
  ('prop-002', 'Harbour View Office', '45 Dock Street, Cape Town', 'commercial', 'active'),
  ('prop-003', 'Greenfield Estate', '88 Oak Avenue, Durban', 'residential', 'active');

INSERT OR IGNORE INTO contacts (id, name, phone, email, company) VALUES
  ('ctc-001', 'John Owner', '+27 82 555 0101', 'john@example.com', 'J Properties'),
  ('ctc-002', 'Jane Tenant', '+27 72 555 0202', 'jane@example.com', NULL),
  ('ctc-003', 'Bob Agent', '+27 62 555 0303', 'bob@agency.co.za', 'Prime Agency');

INSERT OR IGNORE INTO property_contacts (property_id, contact_id, role) VALUES
  ('prop-001', 'ctc-001', 'owner'),
  ('prop-001', 'ctc-002', 'tenant'),
  ('prop-002', 'ctc-001', 'owner'),
  ('prop-003', 'ctc-003', 'agent');

INSERT OR IGNORE INTO suppliers (id, name, service_type, phone, email) VALUES
  ('sup-001', 'QuickFix Plumbing', 'Plumbing', '+27 11 555 0404', 'jobs@quickfix.co.za'),
  ('sup-002', 'Spark Electric', 'Electrical', '+27 11 555 0505', 'service@sparkelectric.co.za'),
  ('sup-003', 'Coastal HVAC', 'HVAC', '+27 21 555 0606', 'support@coastalhvac.co.za');

INSERT OR IGNORE INTO invoices (id, property_id, supplier_id, amount, currency, due_date, status, description, category) VALUES
  ('inv-001', 'prop-001', 'sup-001', 4500.00, 'ZAR', date('now', '+14 days'), 'pending', 'Blocked drain repair', 'plumbing'),
  ('inv-002', 'prop-001', 'sup-002', 8200.50, 'ZAR', date('now', '-3 days'), 'overdue', 'DB board upgrade', 'electrical'),
  ('inv-003', 'prop-002', 'sup-003', 12500.00, 'ZAR', date('now', '-1 days'), 'paid', 'Quarterly HVAC service', 'hvac');

INSERT OR IGNORE INTO maintenance (id, property_id, title, description, status, priority) VALUES
  ('maint-001', 'prop-001', 'Hallway lights', 'Replace light fixtures floor 2', 'open', 'medium'),
  ('maint-002', 'prop-002', 'Roof inspection', 'Inspect after storm damage', 'in_progress', 'high'),
  ('maint-003', 'prop-003', 'Irrigation leak', 'Landscape irrigation near gate', 'open', 'low');

INSERT OR IGNORE INTO municipalities (id, name, region) VALUES
  ('mun-001', 'City of Johannesburg', 'Gauteng'),
  ('mun-002', 'City of Cape Town', 'Western Cape'),
  ('mun-003', 'eThekwini Municipality', 'KwaZulu-Natal');

INSERT OR IGNORE INTO body_corporates (id, name, registration_number, email) VALUES
  ('bc-001', 'Sunset Body Corporate', 'BC2020-001', 'trustees@sunsetbc.co.za'),
  ('bc-002', 'Greenfield Homeowners', 'HO2022-015', 'board@greenfieldhoa.co.za');

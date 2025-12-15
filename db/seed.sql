USE helfy;

-- Default admin user (password: Password123!)
INSERT INTO users (email, password_hash)
VALUES ('admin@helfy.local', '$2b$10$3vmURw.af7W0aUw4QKe5C..Qlr4E/OeHq5EOl7D6pJ9Yfqip4hfyq')
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash);

-- Optional: default token for the admin user (hashed token: sha256 of 'devtoken-123')
INSERT INTO tokens (user_id, token_hash, expires_at)
SELECT id, 'a772fefa6311bea84c97a9a02fbdb7e506ad5ffa7160ef094c072685f1ff7f8a', DATE_ADD(NOW(), INTERVAL 7 DAY)
FROM users
WHERE email = 'admin@helfy.local'
  AND NOT EXISTS (SELECT 1 FROM tokens WHERE token_hash = 'a772fefa6311bea84c97a9a02fbdb7e506ad5ffa7160ef094c072685f1ff7f8a');

INSERT INTO products (slug, name, target_audience, description)
VALUES
  ('doctorabc', 'DoctorABC', 'patient', 'Patient app for telehealth and follow-up.'),
  ('doctorpanel', 'DoctorPanel', 'doctor', 'Clinician console for consults and patient management.'),
  ('pharmacypanel', 'PharmacyPanel', 'pharmacy', 'Pharmacy portal for prescriptions and inventory.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  target_audience = VALUES(target_audience),
  description = VALUES(description);

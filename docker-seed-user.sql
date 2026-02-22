-- Demo user for Docker login (ciso@astra.ai / password123)
-- bcrypt hash for "password123" (10 rounds)
INSERT OR IGNORE INTO User (id, name, email, password, role, createdAt, updatedAt) VALUES
('docker-ciso-seed-001', 'Sarah Connor', 'ciso@astra.ai', '$2b$10$N2Ct2XdKOuHNxzU3rAAt/efUK6oB4sYZYDxYIe3neMgG1RAKUBOLO', 'CISO', datetime('now'), datetime('now'));

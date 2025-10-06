-- Script pour créer une équipe de test manuellement
-- Cela résoudra le problème de contrainte de clé étrangère

-- 1. Créer une équipe de test avec un ID fixe
INSERT INTO teams (id, name, description, owner_id, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Équipe de Test',
    'Équipe créée pour tester la création de projets',
    'test-user-id',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 2. Créer un membre d'équipe de test
INSERT INTO team_members (team_id, user_id, email, name, role, status, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'test-user-id',
    'test@example.com',
    'Utilisateur Test',
    'admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (team_id, user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    updated_at = NOW();

-- 3. Vérifier que l'équipe a été créée
SELECT 
    id,
    name,
    description,
    owner_id,
    created_at
FROM teams 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- 4. Vérifier les membres de l'équipe
SELECT 
    team_id,
    user_id,
    email,
    name,
    role,
    status
FROM team_members 
WHERE team_id = '11111111-1111-1111-1111-111111111111';
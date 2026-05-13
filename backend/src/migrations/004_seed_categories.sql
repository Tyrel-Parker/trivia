INSERT INTO categories (name) VALUES
  ('Constitutional Amendments'),
  ('Failed Amendments'),
  ('U.S. History'),
  ('Space'),
  ('Physics'),
  ('Math'),
  ('Computer Science'),
  ('Adulting')
ON CONFLICT (name) DO NOTHING;

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Constitutional Amendments')
WHERE id IN (6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,34);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Failed Amendments')
WHERE id IN (30,31,32,33);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'U.S. History')
WHERE id IN (3);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Space')
WHERE id IN (4,5,57,58,59,60,61);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Physics')
WHERE id IN (35,36,37,38,39);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Math')
WHERE id IN (40,41,42,43,44);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Computer Science')
WHERE id IN (1,2,45,46,47,48,49,50);

UPDATE facts SET category_id = (SELECT id FROM categories WHERE name = 'Adulting')
WHERE id IN (51,52,53,54,55,56);

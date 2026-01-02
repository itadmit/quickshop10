-- Check inventory for products
SELECT 
  p.id,
  p.name,
  p.inventory,
  pv.id as variant_id,
  pv.title as variant_title,
  pv.inventory as variant_inventory
FROM products p
LEFT JOIN product_variants pv ON pv.product_id = p.id
WHERE p.name ILIKE '%שמלת מידי%' OR p.name ILIKE '%תיק צד%'
ORDER BY p.name, pv.title;

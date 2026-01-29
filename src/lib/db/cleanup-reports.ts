import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient);

async function cleanup() {
  console.log('🧹 Cleaning up partial seed data...');
  
  try {
    await db.execute(sql`DELETE FROM analytics_events`);
    console.log('   ✓ analytics_events');
  } catch (e) { console.log('   - analytics_events (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM search_queries`);
    console.log('   ✓ search_queries');
  } catch (e) { console.log('   - search_queries (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM abandoned_carts`);
    console.log('   ✓ abandoned_carts');
  } catch (e) { console.log('   - abandoned_carts (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM gift_card_transactions`);
    console.log('   ✓ gift_card_transactions');
  } catch (e) { console.log('   - gift_card_transactions (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM gift_cards`);
    console.log('   ✓ gift_cards');
  } catch (e) { console.log('   - gift_cards (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM influencer_sales`);
    console.log('   ✓ influencer_sales');
  } catch (e) { console.log('   - influencer_sales (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM influencers`);
    console.log('   ✓ influencers');
  } catch (e) { console.log('   - influencers (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM refunds`);
    console.log('   ✓ refunds');
  } catch (e) { console.log('   - refunds (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM customers WHERE email LIKE '%@example.com'`);
    console.log('   ✓ example customers');
  } catch (e) { console.log('   - example customers (skipped)'); }
  
  try {
    await db.execute(sql`DELETE FROM discounts WHERE code IN ('NOA20', 'MIKA15', 'DANA25')`);
    console.log('   ✓ influencer discounts');
  } catch (e) { console.log('   - influencer discounts (skipped)'); }
  
  console.log('\n✅ Cleanup done');
}

cleanup()
  .then(() => process.exit(0))
  .catch(e => { console.error(e); process.exit(1); });











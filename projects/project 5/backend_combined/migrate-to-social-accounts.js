import { sequelize, User, SocialAccount, InstagramAccount } from './src/models/index.js';

async function migrate() {
  try {
    console.log('🔄 Starting migration: Instagram accounts → Social accounts...\n');

    // Get all Instagram accounts
    const instagramAccounts = await InstagramAccount.findAll();
    console.log(`Found ${instagramAccounts.length} Instagram accounts to migrate\n`);

    let migrated = 0;
    for (const igAccount of instagramAccounts) {
      try {
        // Check if account already exists
        const existing = await SocialAccount.findOne({
          where: {
            user_id: igAccount.user_id,
            username: igAccount.username,
            platform: 'instagram'
          }
        });

        if (!existing) {
          // Create social account from Instagram account
          await SocialAccount.create({
            user_id: igAccount.user_id,
            platform: 'instagram',
            username: igAccount.username,
            account_id: igAccount.id, // Store original IG account ID as reference
            profile_url: igAccount.profile_url || null,
            status: igAccount.status || 'active',
            followers_count: igAccount.followers || 0,
            following_count: igAccount.following || 0,
            posts_count: 0,
            last_activity: igAccount.last_activity || new Date(),
            health_score: 100,
            verification_status: 'verified',
            access_token: igAccount.access_token || null,
            refresh_token: igAccount.refresh_token || null,
            token_expires_at: igAccount.token_expires_at || null,
            account_data: igAccount.settings || {},
          });

          console.log(`✅ Migrated: ${igAccount.username} (${igAccount.user_id})`);
          migrated++;
        } else {
          console.log(`⏭️  Skipped: ${igAccount.username} (already exists)`);
        }
      } catch (err) {
        console.error(`❌ Error migrating ${igAccount.username}:`, err.message);
      }
    }

    console.log(`\n✅ Migration complete! ${migrated} accounts migrated.\n`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrate();

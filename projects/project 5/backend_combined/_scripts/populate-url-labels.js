/**
 * Populate URL Labels for existing services
 * This script sets default URL labels based on service names and platforms
 */
import { sequelize } from '../src/config/database.js';
import { Service, Platform } from '../src/models/index.js';

async function populateUrlLabels() {
  try {
    console.log('Starting URL Label population...');

    // Define URL label mappings by service name and platform
    const labelMappings = {
      'instagram': {
        'Likes': 'Instagram Post URL',
        'Followers': 'Instagram Profile URL',
        'Views': 'Instagram Post/Reel URL',
        'Comments': 'Instagram Post URL',
      },
      'youtube': {
        'Views': 'YouTube Video URL',
        'Subscribers': 'YouTube Channel URL',
        'Likes': 'YouTube Video URL',
        'Watch Time': 'YouTube Video URL',
      },
    };

    // Fetch all services with their platforms
    const services = await Service.findAll({
      include: [
        {
          model: Platform,
          as: 'platform',
          attributes: ['id', 'name'],
        },
      ],
    });

    let updated = 0;
    let skipped = 0;

    for (const service of services) {
      // Skip if already has a urlLabel
      if (service.urlLabel) {
        console.log(`✓ Skipping ${service.name} (already has label: ${service.urlLabel})`);
        skipped++;
        continue;
      }

      const platformName = service.platform?.name?.toLowerCase();
      const serviceName = service.name;

      // Check if there's a mapping for this combination
      let label = labelMappings[platformName]?.[serviceName];

      // If no specific mapping, generate a generic one
      if (!label) {
        label = `${platformName?.charAt(0).toUpperCase() + platformName?.slice(1)} ${serviceName}`;
      }

      // Update the service with the generated label
      await service.update({ urlLabel: label });
      console.log(`✓ Updated ${serviceName} with label: "${label}"`);
      updated++;
    }

    console.log(`\n✅ Completed! Updated ${updated} services, Skipped ${skipped} services`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating URL labels:', error);
    process.exit(1);
  }
}

populateUrlLabels();

/**
 * Reset and Populate URL Labels for all services with proper values
 */
import { Service, Platform } from '../src/models/index.js';

async function resetAndPopulateUrlLabels() {
  try {
    console.log('Starting URL Label reset and population...\n');

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

    console.log(`Found ${services.length} services to update\n`);

    let updated = 0;

    for (const service of services) {
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
      console.log(`✓ Updated "${serviceName}" → "${label}"`);
      updated++;
    }

    console.log(`\n✅ Completed! Updated ${updated} services with proper URL labels`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating URL labels:', error);
    process.exit(1);
  }
}

resetAndPopulateUrlLabels();

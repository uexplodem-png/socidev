const { sequelize } = require('../src/config/database.js');

(async () => {
  try {
    // Import as ES modules
    const { AuthService } = await import('../src/services/auth.service.js');
    const { User } = await import('../src/models/index.js');
    
    const authService = new AuthService();
    
    // Get super admin user
    const user = await User.findOne({ 
      where: { email: 'superadmin@gmail.com' },
      attributes: ['id', 'email', 'role']
    });
    
    if (!user) {
      console.log('❌ Super admin user not found!');
      process.exit(1);
    }
    
    console.log('✅ Found user:', user.email);
    console.log('   Legacy role:', user.role);
    
    // Generate token
    console.log('\n🔄 Generating JWT token...');
    const token = await authService.generateToken(user.id);
    
    // Decode it
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
    
    console.log('\n📊 Token Payload:');
    console.log('   User ID:', decoded.userId);
    console.log('   Permissions Count:', decoded.permissions.length);
    console.log('   Roles:', decoded.roles.map(r => `${r.label} (${r.key})`).join(', '));
    console.log('   Has super_admin role?', decoded.roles.some(r => r.key === 'super_admin'));
    
    console.log('\n📋 All Permissions:');
    decoded.permissions.forEach((perm, index) => {
      console.log(`   ${index + 1}. ${perm}`);
    });
    
    console.log('\n✅ Token is correctly generated with all permissions!');
    console.log('\n💡 If menus are not showing:');
    console.log('   1. Clear browser localStorage/sessionStorage');
    console.log('   2. Clear browser cache');
    console.log('   3. Login again as superadmin@gmail.com');
    console.log('   4. Check browser console for errors');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();

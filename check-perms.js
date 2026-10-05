require('dotenv').config({ path: '.env.local' });
const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});

(async () => {
  try {
    // Check user
    const user = await knex('users')
      .select('id', 'email', 'role_id')
      .where('email', 'test@atline.com.my')
      .first();
    
    console.log('User:', JSON.stringify(user, null, 2));
    
    if (user && user.role_id) {
      // Check role
      const role = await knex('roles').where('id', user.role_id).first();
      console.log('\nRole:', JSON.stringify(role, null, 2));
      
      // Check permissions count
      const [{ total }] = await knex('role_permissions')
        .where('role_id', user.role_id)
        .count('* as total');
      console.log('\nTotal permissions:', total);
      
      // Sample permissions
      const perms = await knex('role_permissions')
        .where('role_id', user.role_id)
        .limit(10);
      console.log('\nFirst 10 Permissions:', JSON.stringify(perms, null, 2));
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();

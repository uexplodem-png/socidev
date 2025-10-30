'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'restricted_permissions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: null,
      comment: 'Admin tarafından sınırlandırılmış yetkiler - ["orders.create", "withdrawals.create"] gibi'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'restricted_permissions');
  }
};

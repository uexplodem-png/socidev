"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop old columns
    await queryInterface.sequelize.query(`
      ALTER TABLE order_statistics 
      DROP COLUMN IF EXISTS avg_delivery_time,
      DROP COLUMN IF EXISTS avg_delivery_time_growth;
    `);

    // Add new columns
    const columns = await queryInterface.describeTable("order_statistics");

    if (!columns.total_orders) {
      await queryInterface.addColumn("order_statistics", "total_orders", {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: "total_orders",
      });
    }

    if (!columns.total_orders_growth) {
      await queryInterface.addColumn(
        "order_statistics",
        "total_orders_growth",
        {
          type: Sequelize.FLOAT,
          defaultValue: 0,
          field: "total_orders_growth",
        }
      );
    }

    // Update existing rows to set total_orders
    await queryInterface.sequelize.query(`
      UPDATE order_statistics 
      SET total_orders = active_orders + completed_orders,
          total_orders_growth = 0
      WHERE total_orders IS NULL;
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove new columns
    await queryInterface.removeColumn("order_statistics", "total_orders");
    await queryInterface.removeColumn(
      "order_statistics",
      "total_orders_growth"
    );

    // Add back old columns
    await queryInterface.addColumn("order_statistics", "avg_delivery_time", {
      type: Sequelize.FLOAT,
      defaultValue: 0,
      field: "avg_delivery_time",
    });

    await queryInterface.addColumn(
      "order_statistics",
      "avg_delivery_time_growth",
      {
        type: Sequelize.FLOAT,
        defaultValue: 0,
        field: "avg_delivery_time_growth",
      }
    );
  },
};

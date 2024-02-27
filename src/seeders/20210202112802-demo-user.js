import { generateHash } from '../utils/helper';

export default {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert(
      {
        tableName: 'Users',
        schema: process.env.SCHEMA_NAME,
      },
      [
        {
          username: 'iamauser',
          email: 'admin@email.com',
          password: generateHash('admin123'),
          role: 'super',
          isActive: true,
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
      ],
      {}
    );
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      {
        tableName: 'Users',
        schema: process.env.SCHEMA_NAME,
      },
      null,
      {}
    );
  },
};

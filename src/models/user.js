import { Model } from 'sequelize';

export default (sequelize, { STRING, INTEGER, ENUM, BOOLEAN }) => {
  class User extends Model {
    // static associate() {
    // }
  }

  User.init(
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: INTEGER,
        autoIncrement: true,
      },
      username: {
        type: STRING,
        allowNull: false,
      },
      email: {
        type: STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: STRING,
        allowNull: false,
      },
      role: {
        type: ENUM('super', 'admin', 'user'),
        defaultValue: 'user',
      },
      isActive: {
        type: BOOLEAN,
      },
      avatar: {
        type: STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      paranoid: true,
      timestamps: true,
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['email'],
        },
      ],
    }
  );
  return User;
};

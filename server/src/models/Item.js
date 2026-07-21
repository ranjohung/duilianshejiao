const pool = require('../config/database');

class Item {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM items');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);
    return rows[0];
  }

  static async getUserInventory(userId) {
    const [rows] = await pool.execute(
      `SELECT i.id, i.name, i.description, i.icon, i.price, ui.quantity
       FROM user_inventory ui
       JOIN items i ON ui.item_id = i.id
       WHERE ui.user_id = ? AND ui.quantity > 0`,
      [userId]
    );
    return rows;
  }

  static async getUserItemCount(userId, itemId) {
    const [rows] = await pool.execute(
      'SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );
    return rows[0]?.quantity || 0;
  }

  static async addItemToUser(userId, itemId, quantity = 1) {
    const [existing] = await pool.execute(
      'SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ?',
      [userId, itemId]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE user_inventory SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
        [quantity, userId, itemId]
      );
    } else {
      await pool.execute(
        'INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, ?)',
        [userId, itemId, quantity]
      );
    }

    return this.getUserItemCount(userId, itemId);
  }

  static async useItem(userId, itemId) {
    const count = await this.getUserItemCount(userId, itemId);
    if (count <= 0) {
      return { success: false, message: '道具数量不足' };
    }

    await pool.execute(
      'UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0',
      [userId, itemId]
    );

    return {
      success: true,
      message: '道具使用成功',
      remaining: await this.getUserItemCount(userId, itemId)
    };
  }

  static async create(itemData) {
    const { id, name, description, icon, price, type } = itemData;
    const [result] = await pool.execute(
      'INSERT INTO items (id, name, description, icon, price, type) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, description, icon, price, type]
    );
    return result.insertId;
  }

  static async initItems() {
    const items = [
      { id: 'time_shuttle', name: '时空穿梭券', description: '可以回到上一轮重新选择', icon: '⏳', price: 0, type: 'consumable' },
      { id: 'hint_card', name: '提示卡', description: '获取教练的提示', icon: '💡', price: 0, type: 'consumable' },
      { id: 'emotion_shield', name: '情绪护盾', description: '防止情绪波动', icon: '🛡️', price: 0, type: 'consumable' },
      { id: 'double_points', name: '双倍积分卡', description: '本轮获得双倍积分', icon: '⭐', price: 0, type: 'consumable' },
    ];

    for (const item of items) {
      const existing = await this.findById(item.id);
      if (!existing) {
        await this.create(item);
      }
    }
  }
}

module.exports = Item;

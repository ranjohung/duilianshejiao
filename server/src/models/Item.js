const pool = require('../config/database');

class Item {
  // 查找所有道具（道具目录）
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM items WHERE is_active = 1 ORDER BY id');
    return rows;
  }

  // 根据ID查找道具
  static async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM items WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // 根据item_type查找道具
  static async findByType(itemType) {
    const [rows] = await pool.execute('SELECT * FROM items WHERE item_type = ?', [itemType]);
    return rows[0] || null;
  }

  // 获取用户道具背包
  static async findByUser(userId) {
    const [rows] = await pool.execute(
      `SELECT ui.*, i.name, i.description, i.icon, i.category, i.item_type, i.price_coins
       FROM user_items ui
       JOIN items i ON ui.item_id = i.id
       WHERE ui.user_id = ? AND ui.quantity > 0
       ORDER BY i.category, i.id`,
      [userId]
    );
    return rows;
  }

  // 查找用户某类道具
  static async findByUserAndType(userId, itemType) {
    const [rows] = await pool.execute(
      `SELECT ui.*, i.name, i.item_type FROM user_items ui
       JOIN items i ON ui.item_id = i.id
       WHERE ui.user_id = ? AND i.item_type = ?`,
      [userId, itemType]
    );
    return rows[0] || null;
  }

  // 发放道具给用户
  static async grantItem(userId, itemType, quantity = 1) {
    const item = await this.findByType(itemType);
    if (!item) return null;

    const [existing] = await pool.execute(
      'SELECT * FROM user_items WHERE user_id = ? AND item_id = ?',
      [userId, item.id]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE user_items SET quantity = quantity + ? WHERE id = ?',
        [quantity, existing[0].id]
      );
      return existing[0].id;
    }

    const [result] = await pool.execute(
      'INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)',
      [userId, item.id, quantity]
    );
    return result.insertId;
  }

  // 使用道具
  static async useItem(userId, itemType, quantity = 1) {
    const userItem = await this.findByUserAndType(userId, itemType);
    if (!userItem || userItem.quantity < quantity) return false;
    await pool.execute(
      'UPDATE user_items SET quantity = quantity - ? WHERE id = ?',
      [quantity, userItem.id]
    );
    return true;
  }
}

module.exports = Item;

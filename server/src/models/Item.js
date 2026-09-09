const pool = require('../config/database');

class Item {
  // 道具对业务层使用稳定的 item_type；数据库 user_items.item_id 保存 items.id。
  static async resolveItemId(itemType) {
    const [rows] = await pool.execute(
      'SELECT id FROM items WHERE item_type = ? OR id = ? LIMIT 1',
      [itemType, itemType]
    );
    return rows[0]?.id || null;
  }

  static async resolveItemIdInTransaction(connection, itemType) {
    const [rows] = await connection.execute(
      'SELECT id FROM items WHERE item_type = ? OR id = ? LIMIT 1',
      [itemType, itemType]
    );
    return rows[0]?.id || null;
  }

  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM items');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM items WHERE id = ? OR item_type = ? LIMIT 1',
      [id, id]
    );
    return rows[0];
  }

  static async getUserInventory(userId) {
    const [rows] = await pool.execute(
      `SELECT i.id, i.item_type, i.name, i.description, i.icon, i.price_coins, ui.quantity
       FROM user_items ui
       JOIN items i ON ui.item_id = i.id
       WHERE ui.user_id = ? AND ui.quantity > 0`,
      [userId]
    );
    return rows;
  }

  static async getUserItemCount(userId, itemId) {
    const [rows] = await pool.execute(
      `SELECT ui.quantity
         FROM user_items ui
         JOIN items i ON i.id = ui.item_id
        WHERE ui.user_id = ? AND (i.item_type = ? OR CAST(i.id AS CHAR) = ?)
        LIMIT 1`,
      [userId, itemId, String(itemId)]
    );
    return rows[0]?.quantity || 0;
  }

  static async addItemToUser(userId, itemId, quantity = 1) {
    const itemDbId = await this.resolveItemId(itemId);
    if (!itemDbId) throw new Error(`道具不存在：${itemId}`);
    const [existing] = await pool.execute(
      'SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ?',
      [userId, itemDbId]
    );

    if (existing.length > 0) {
      await pool.execute(
        'UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
        [quantity, userId, itemDbId]
      );
    } else {
      await pool.execute(
        'INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)',
        [userId, itemDbId, quantity]
      );
    }

    return this.getUserItemCount(userId, itemId);
  }

  // 在已有事务中增加道具，避免签到/任务记录已写入但奖励在另一个连接失败。
  static async addItemToUserInTransaction(connection, userId, itemId, quantity = 1) {
    const itemDbId = await this.resolveItemIdInTransaction(connection, itemId);
    if (!itemDbId) throw new Error(`道具不存在：${itemId}`);
    const [existing] = await connection.execute(
      'SELECT quantity FROM user_items WHERE user_id = ? AND item_id = ? FOR UPDATE',
      [userId, itemDbId]
    );

    if (existing.length > 0) {
      await connection.execute(
        'UPDATE user_items SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?',
        [quantity, userId, itemDbId]
      );
    } else {
      await connection.execute(
        'INSERT INTO user_items (user_id, item_id, quantity) VALUES (?, ?, ?)',
        [userId, itemDbId, quantity]
      );
    }

    const [rows] = await connection.execute(
      `SELECT ui.quantity
         FROM user_items ui
         JOIN items i ON ui.item_id = i.id
        WHERE ui.user_id = ? AND ui.item_id = ?
        LIMIT 1`,
      [userId, itemDbId]
    );
    return Number(rows[0]?.quantity) || 0;
  }

  // 旧控制器曾使用 addItem；保留别名但统一走 user_items 和 item_type 解析。
  static async addItem(userId, itemId, quantity = 1) {
    return this.addItemToUser(userId, itemId, quantity);
  }

  static async useItem(userId, itemId) {
    const itemDbId = await this.resolveItemId(itemId);
    if (!itemDbId) return { success: false, message: '道具不存在' };

    const [result] = await pool.execute(
      'UPDATE user_items SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0',
      [userId, itemDbId]
    );
    if (result.affectedRows === 0) return { success: false, message: '道具数量不足' };

    return {
      success: true,
      message: '道具使用成功',
      remaining: await this.getUserItemCount(userId, itemId)
    };
  }

  static async create(itemData) {
    const { id, name, description, icon, price, price_coins, type, item_type } = itemData;
    const itemType = item_type || type || id;
    const [result] = await pool.execute(
      'INSERT INTO items (name, item_type, description, icon, price_coins) VALUES (?, ?, ?, ?, ?)',
      [name, itemType, description || '', icon || '', price_coins ?? price ?? 0]
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

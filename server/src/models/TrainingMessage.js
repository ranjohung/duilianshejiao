const pool = require('../config/database');

class TrainingMessage {
  static async create({
    trainingId,
    senderType,
    content,
    emotion,
    action,
    choiceIndex,
    scoreDelta,
  }) {
    const [result] = await pool.execute(
      `INSERT INTO training_messages 
       (training_id, sender_type, content, emotion, action, choice_index, score_delta, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [trainingId, senderType, content, emotion, action, choiceIndex, scoreDelta]
    );
    return result.insertId;
  }

  static async findByTraining(trainingId) {
    const [rows] = await pool.execute(
      'SELECT * FROM training_messages WHERE training_id = ? ORDER BY created_at ASC',
      [trainingId]
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM training_messages WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async deleteByTraining(trainingId) {
    const [result] = await pool.execute(
      'DELETE FROM training_messages WHERE training_id = ?',
      [trainingId]
    );
    return result.affectedRows;
  }

  static async countByTraining(trainingId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM training_messages WHERE training_id = ?',
      [trainingId]
    );
    return rows[0].total;
  }
}

module.exports = TrainingMessage;
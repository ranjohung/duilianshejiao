import 'package:intl/intl.dart';

/// 日期工具类
class DateUtils {
  DateUtils._();

  /// 格式化日期为 yyyy-MM-dd
  static String formatDate(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  /// 格式化日期时间为 yyyy-MM-dd HH:mm
  static String formatDateTime(DateTime dateTime) {
    return DateFormat('yyyy-MM-dd HH:mm').format(dateTime);
  }

  /// 格式化时间为 HH:mm
  static String formatTime(DateTime dateTime) {
    return DateFormat('HH:mm').format(dateTime);
  }

  /// 获取友好的时间描述（如：刚刚、5分钟前、1小时前、昨天）
  static String friendlyTime(DateTime dateTime) {
    final now = DateTime.now();
    final diff = now.difference(dateTime);

    if (diff.inSeconds < 60) return '刚刚';
    if (diff.inMinutes < 60) return '${diff.inMinutes}分钟前';
    if (diff.inHours < 24) return '${diff.inHours}小时前';
    if (diff.inDays < 2) return '昨天';
    if (diff.inDays < 7) return '${diff.inDays}天前';
    return formatDate(dateTime);
  }

  /// 计算连续打卡天数
  static int calculateStreak(List<DateTime> checkInDates) {
    // TODO: 实现连续打卡天数计算逻辑
    return 0;
  }
}

import 'package:flutter/material.dart';

/// Flutter 首发客户端在服务端教练接口不可用时展示的预设教练资料。
/// 仅用于选择页演示，不承诺服务端已创建对应教练记录。
class PresetCoachData {
  final String name;
  final String style;
  final Color color;
  final IconData icon;

  const PresetCoachData({
    required this.name,
    required this.style,
    required this.color,
    required this.icon,
  });
}

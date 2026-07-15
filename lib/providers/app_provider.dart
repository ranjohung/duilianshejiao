import 'package:flutter/material.dart';

/// 全局状态管理
/// 使用Provider进行状态管理
class AppProvider extends ChangeNotifier {
  /// 当前用户ID
  String? _userId;
  String? get userId => _userId;

  /// 是否已登录
  bool get isLoggedIn => _userId != null;

  /// 当前选中的教练ID
  String? _currentCoachId;
  String? get currentCoachId => _currentCoachId;

  /// 当前选中的场景ID
  String? _currentSceneId;
  String? get currentSceneId => _currentSceneId;

  /// 设置用户登录
  void setUser(String userId) {
    _userId = userId;
    notifyListeners();
  }

  /// 用户登出
  void logout() {
    _userId = null;
    _currentCoachId = null;
    _currentSceneId = null;
    notifyListeners();
  }

  /// 选择教练
  void selectCoach(String coachId) {
    _currentCoachId = coachId;
    notifyListeners();
  }

  /// 选择场景
  void selectScene(String sceneId) {
    _currentSceneId = sceneId;
    notifyListeners();
  }
}

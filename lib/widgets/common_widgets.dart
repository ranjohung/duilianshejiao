import 'package:flutter/material.dart';

/// 通用组件集合
/// 包含项目中复用的UI组件

/// 通用加载指示器
Widget loadingWidget() => const Center(child: CircularProgressIndicator());

/// 通用空状态提示
Widget emptyWidget({String message = '暂无数据'}) => Center(
      child: Text(message, style: const TextStyle(color: Colors.grey)),
    );

/// 通用错误提示
Widget errorWidget({String message = '加载失败', VoidCallback? onRetry}) => Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(message, style: const TextStyle(color: Colors.red)),
          if (onRetry != null)
            TextButton(onPressed: onRetry, child: const Text('重试')),
        ],
      ),
    );

import 'package:flutter/material.dart';
import '../../config/app_config.dart';
import '../../network/services/auth_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController();
  final _codeController = TextEditingController();
  final _authService = AuthService();
  bool _agreed = false;
  bool _loading = false;
  int _countdown = 0;

  Future<void> _sendCode() async {
    final phone = _phoneController.text.trim();
    if (phone.length != 11 || !RegExp(r'^1[3-9]\d{9}$').hasMatch(phone)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入正确的手机号')),
      );
      return;
    }
    try {
      final result = await _authService.sendCode(phone: phone);
      if (result.isSuccess) {
        setState(() => _countdown = 60);
        _startCountdown();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('验证码已发送')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message)),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('发送失败: $e')),
      );
    }
  }

  void _startCountdown() {
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _countdown--);
      return _countdown > 0;
    });
  }

  Future<void> _login() async {
    if (!_agreed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请先同意用户协议')),
      );
      return;
    }
    final phone = _phoneController.text.trim();
    final code = _codeController.text.trim();
    if (phone.isEmpty || code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('请输入手机号和验证码')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final result = await _authService.login(phone: phone, code: code);
      if (result.isSuccess) {
        // 登录成功，检查是否需要实名认证
        final needVerify = result.data?['needRealNameVerify'] as bool? ?? false;
        if (mounted) {
          if (needVerify) {
            Navigator.of(context).pushReplacementNamed('/real-name');
          } else {
            Navigator.of(context).pushReplacementNamed('/home');
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(result.message)),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('登录失败: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: SizedBox(
            height: MediaQuery.of(context).size.height - MediaQuery.of(context).padding.top - MediaQuery.of(context).padding.bottom,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo区域
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: AppConfig.primaryColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(Icons.psychology, size: 48, color: AppConfig.primaryColor),
                ),
                const SizedBox(height: 20),
                Text(
                  '对练社交',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppConfig.primaryColor,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'AI驱动的社交训练平台',
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
                const SizedBox(height: 48),

                // 手机号输入框
                TextField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  maxLength: 11,
                  decoration: InputDecoration(
                    hintText: '请输入手机号',
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: Icon(Icons.phone_android, color: AppConfig.primaryColor),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppConfig.primaryColor, width: 1.5),
                    ),
                    counterText: '',
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
                const SizedBox(height: 16),

                // 验证码输入框 + 发送按钮
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _codeController,
                        keyboardType: TextInputType.number,
                        maxLength: 6,
                        decoration: InputDecoration(
                          hintText: '验证码',
                          hintStyle: TextStyle(color: Colors.grey[400]),
                          prefixIcon: Icon(Icons.sms, color: AppConfig.primaryColor),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey[300]!),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: Colors.grey[300]!),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide(color: AppConfig.primaryColor, width: 1.5),
                          ),
                          counterText: '',
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    SizedBox(
                      width: 120,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: _countdown > 0 ? null : _sendCode,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _countdown > 0 ? Colors.grey[300] : AppConfig.accentColor,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          _countdown > 0 ? '${_countdown}s' : '获取验证码',
                          style: const TextStyle(fontSize: 14),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // 登录/注册按钮
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _login,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppConfig.primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 2,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(
                            '登录 / 注册',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                          ),
                  ),
                ),
                const SizedBox(height: 24),

                // 用户协议 + 隐私政策
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      width: 24,
                      height: 24,
                      child: Checkbox(
                        value: _agreed,
                        onChanged: (v) => setState(() => _agreed = v ?? false),
                        activeColor: AppConfig.primaryColor,
                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text('我已阅读并同意', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    GestureDetector(
                      onTap: () {
                        // TODO: 打开用户协议页面
                      },
                      child: Text(
                        '《用户协议》',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConfig.primaryColor,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                    Text('和', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    GestureDetector(
                      onTap: () {
                        // TODO: 打开隐私政策页面
                      },
                      child: Text(
                        '《隐私政策》',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppConfig.primaryColor,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _codeController.dispose();
    super.dispose();
  }
}

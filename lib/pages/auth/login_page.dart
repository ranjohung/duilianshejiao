import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../config/app_config.dart';
import '../../network/services/auth_service.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _phoneController = TextEditingController(text: '13800138000');
  final _passwordController = TextEditingController(text: '123456');
  final _smsCodeController = TextEditingController();
  final _nicknameController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _authService = AuthService();

  bool _isPasswordLogin = true;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  bool _isRegister = false;
  bool _isLoading = false;
  bool _isSendingSms = false;
  String? _errorMessage;

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _smsCodeController.dispose();
    _nicknameController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _sendSmsCode() async {
    if (_isSendingSms) return;
    if (_phoneController.text.length != 11) {
      _showError('请输入正确的手机号');
      return;
    }

    setState(() => _isSendingSms = true);
    try {
      await _authService.sendCode(phone: _phoneController.text);
      _showSuccess('验证码已发送');
      await _countdownSms();
    } catch (e) {
      _showError('发送失败: $e');
    } finally {
      setState(() => _isSendingSms = false);
    }
  }

  Future<void> _countdownSms() async {
    int count = 60;
    while (count > 0) {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) break;
      setState(() => count--);
    }
  }

  Future<void> _doLogin() async {
    if (_isLoading) return;

    final phone = _phoneController.text.trim();
    if (phone.length != 11) {
      _showError('请输入正确的手机号');
      return;
    }

    if (_isPasswordLogin) {
      if (_passwordController.text.length < 6) {
        _showError('密码至少6位');
        return;
      }
    } else {
      if (_smsCodeController.text.length != 6) {
        _showError('请输入6位验证码');
        return;
      }
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _authService.login(
        phone: phone,
        code: _isPasswordLogin ? '123456' : _smsCodeController.text,
      );

      if (result.isSuccess) {
        if (mounted) {
          Navigator.pushReplacementNamed(context, '/home');
        }
      } else {
        _showError(result.message);
      }
    } catch (e) {
      _showError('登录失败: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _doRegister() async {
    if (_isLoading) return;

    final phone = _phoneController.text.trim();
    final nickname = _nicknameController.text.trim();
    final password = _passwordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (phone.length != 11) {
      _showError('请输入正确的手机号');
      return;
    }
    if (_smsCodeController.text.length != 6) {
      _showError('请输入6位验证码');
      return;
    }
    if (nickname.isEmpty) {
      _showError('请输入昵称');
      return;
    }
    if (password.length < 6) {
      _showError('密码至少6位');
      return;
    }
    if (password != confirmPassword) {
      _showError('两次密码不一致');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _authService.register(
        phone: phone,
        code: _smsCodeController.text,
        nickname: nickname,
      );

      if (result.isSuccess) {
        _showSuccess('注册成功');
        setState(() {
          _isRegister = false;
          _isPasswordLogin = true;
        });
      } else {
        _showError(result.message);
      }
    } catch (e) {
      _showError('注册失败: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showError(String message) {
    setState(() => _errorMessage = message);
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context)
        .showSnackBar(SnackBar(content: Text(message)));
  }

  Widget _buildPhoneInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('手机号', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          inputFormatters: [
            LengthLimitingTextInputFormatter(11),
            FilteringTextInputFormatter.digitsOnly,
          ],
          decoration: const InputDecoration(
            hintText: '请输入手机号',
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildPasswordInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('密码', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: _passwordController,
          obscureText: !_showPassword,
          decoration: InputDecoration(
            hintText: '请输入密码',
            border: const OutlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            suffixIcon: IconButton(
              icon: Icon(
                _showPassword ? Icons.visibility : Icons.visibility_off,
              ),
              onPressed: () => setState(() => _showPassword = !_showPassword),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSmsInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('验证码', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _smsCodeController,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  LengthLimitingTextInputFormatter(6),
                  FilteringTextInputFormatter.digitsOnly,
                ],
                decoration: const InputDecoration(
                  hintText: '输入验证码',
                  border: OutlineInputBorder(),
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            ElevatedButton(
              onPressed: _sendSmsCode,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                backgroundColor: AppConfig.primaryColor,
                foregroundColor: Colors.white,
              ),
              child: Text(_isSendingSms ? '发送中...' : '获取验证码'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        const Text('体验验证码：123456', style: TextStyle(fontSize: 12, color: Colors.grey)),
      ],
    );
  }

  Widget _buildNicknameInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('昵称', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: _nicknameController,
          decoration: const InputDecoration(
            hintText: '给自己取个昵称',
            border: OutlineInputBorder(),
            contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
        ),
      ],
    );
  }

  Widget _buildConfirmPasswordInput() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('确认密码', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        TextField(
          controller: _confirmPasswordController,
          obscureText: !_showConfirmPassword,
          decoration: InputDecoration(
            hintText: '请再次输入密码',
            border: const OutlineInputBorder(),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            suffixIcon: IconButton(
              icon: Icon(
                _showConfirmPassword ? Icons.visibility : Icons.visibility_off,
              ),
              onPressed: () => setState(() => _showConfirmPassword = !_showConfirmPassword),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              AppConfig.primaryColor,
              AppConfig.primaryColor.withOpacity(0.8),
              const Color(0xffa855f7),
            ],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  '对练社交',
                  style: TextStyle(fontSize: 32, color: Colors.white, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                const Text(
                  'AI驱动的社交训练平台',
                  style: TextStyle(fontSize: 14, color: Colors.white70),
                ),
                const SizedBox(height: 40),
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.all(Radius.circular(16)),
                    boxShadow: [
                      BoxShadow(color: Colors.black12, blurRadius: 10),
                    ],
                  ),
                  child: Column(
                    children: [
                      if (!_isRegister) ...[
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => setState(() => _isPasswordLogin = true),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _isPasswordLogin
                                      ? AppConfig.primaryColor
                                      : Colors.grey[100],
                                  foregroundColor: _isPasswordLogin
                                      ? Colors.white
                                      : Colors.grey[600],
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: const Text('密码登录'),
                              ),
                            ),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: () => setState(() => _isPasswordLogin = false),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: !_isPasswordLogin
                                      ? AppConfig.primaryColor
                                      : Colors.grey[100],
                                  foregroundColor: !_isPasswordLogin
                                      ? Colors.white
                                      : Colors.grey[600],
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 14),
                                ),
                                child: const Text('短信验证码'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                      ],
                      if (_isRegister) ...[
                        const Text(
                          '创建账号',
                          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 20),
                      ],
                      _buildPhoneInput(),
                      const SizedBox(height: 16),
                      _isPasswordLogin || _isRegister
                          ? _buildPasswordInput()
                          : _buildSmsInput(),
                      const SizedBox(height: 16),
                      if (_isRegister) ...[
                        _buildSmsInput(),
                        const SizedBox(height: 16),
                        _buildNicknameInput(),
                        const SizedBox(height: 16),
                        _buildConfirmPasswordInput(),
                        const SizedBox(height: 16),
                      ],
                      if (_isPasswordLogin && !_isRegister) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () {},
                              child: const Text('忘记密码？'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                      ],
                      if (_errorMessage != null) ...[
                        Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red, fontSize: 12),
                        ),
                        const SizedBox(height: 8),
                      ],
                      ElevatedButton(
                        onPressed: _isRegister ? _doRegister : _doLogin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppConfig.primaryColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 16),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.all(Radius.circular(8)),
                          ),
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(_isRegister ? '注册' : '登录'),
                      ),
                      const SizedBox(height: 16),
                      if (!_isRegister) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('还没有账号？'),
                            TextButton(
                              onPressed: () => setState(() {
                                _isRegister = true;
                                _isPasswordLogin = true;
                              }),
                              child: const Text('立即注册'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ElevatedButton(
                          onPressed: () {
                            _phoneController.text = '13800138000';
                            _passwordController.text = '123456';
                            _doLogin();
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.grey[100],
                            foregroundColor: Colors.grey[700],
                            padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 14),
                          ),
                          child: const Text('使用演示账号登录'),
                        ),
                      ],
                      if (_isRegister) ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('已有账号？'),
                            TextButton(
                              onPressed: () => setState(() {
                                _isRegister = false;
                                _isPasswordLogin = true;
                              }),
                              child: const Text('立即登录'),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
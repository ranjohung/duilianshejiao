import 'package:flutter/material.dart';

import '../models/scene_model.dart';

/// 沉浸式 3D 训练舞台（手绘低多边形风格）
///
/// 对齐 Web 原型 index.html 的 Stage3D 方案：
/// - 主角（左）+ NPC（右）站在对应真实建筑场景中，胸前有名牌
/// - 对话以游戏式气泡锚定在角色头顶，带小尾巴指向头部
/// - 待机呼吸动画 + 说话手势
///
/// 环境按场景名称/阶段关键词映射：咖啡厅 / 办公室 / 家宴 / 餐厅宴请 /
/// 婚礼 / 酒吧 / 楼道 / 通用。
enum StageEnvironment {
  office, // 办公室/会议室：落地窗、办公桌、显示器、绿植
  cafe, // 咖啡厅：吧台、吊灯、展示柜
  family, // 家宴：暖色餐桌、吊灯、边柜
  restaurant, // 餐厅宴请：圆桌转盘、红灯笼
  wedding, // 婚礼：花拱门、花瓣地毯
  bar, // 酒吧：霓虹灯带、吧台凳、酒瓶架
  corridor, // 楼道：堆叠纸箱、顶灯
  generic; // 通用会客厅

  /// 按场景名称/阶段关键词推断环境
  static StageEnvironment fromScene(SceneModel scene) {
    final text = '${scene.name} ${scene.stage} ${scene.description}';
    if (text.contains('咖啡') || text.contains('奶茶') || text.contains('茶水')) {
      return cafe;
    }
    if (text.contains('面试') ||
        text.contains('办公') ||
        text.contains('职场') ||
        text.contains('汇报') ||
        text.contains('述职') ||
        text.contains('领导') ||
        text.contains('加薪') ||
        text.contains('同事') ||
        text.contains('上班')) {
      return office;
    }
    if (text.contains('婚礼') ||
        text.contains('婚') ||
        text.contains('伴郎') ||
        text.contains('伴娘')) {
      return wedding;
    }
    if (text.contains('酒吧') || text.contains('夜店') || text.contains('清吧')) {
      return bar;
    }
    if (text.contains('楼道') ||
        text.contains('邻居') ||
        text.contains('邻里') ||
        text.contains('搬')) {
      return corridor;
    }
    if (text.contains('宴请') ||
        text.contains('商务餐') ||
        text.contains('客户') ||
        text.contains('包厢') ||
        text.contains('中餐')) {
      return restaurant;
    }
    if (text.contains('家') ||
        text.contains('晚餐') ||
        text.contains('父母') ||
        text.contains('亲戚')) {
      return family;
    }
    return generic;
  }
}

/// 舞台上的对话气泡条目
class StageBubbleData {
  final String speaker; // 'user' | 'npc' | 'system'
  final String text;

  const StageBubbleData({required this.speaker, required this.text});
}

/// 沉浸式舞台：场景绘制 + 双角色 + 头顶气泡
class ImmersiveStage extends StatefulWidget {
  /// 舞台环境
  final StageEnvironment environment;

  /// NPC 名称与身份（胸前名牌）
  final String npcName;
  final String npcTitle;

  /// 主角名牌
  final String userName;

  /// 头顶气泡（最多显示每侧 2 条，新亮旧淡）
  final List<StageBubbleData> bubbles;

  /// 当前正在说话的一方（用于说话手势），null 为安静
  final String? speaking;

  const ImmersiveStage({
    super.key,
    required this.environment,
    required this.npcName,
    this.npcTitle = '场景角色',
    this.userName = '我',
    this.bubbles = const [],
    this.speaking,
  });

  @override
  State<ImmersiveStage> createState() => _ImmersiveStageState();
}

class _ImmersiveStageState extends State<ImmersiveStage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _idle =
      AnimationController(vsync: this, duration: const Duration(seconds: 3))
        ..repeat(reverse: true);

  @override
  void dispose() {
    _idle.dispose();
    super.dispose();
  }

  // 角色头部锚点（占舞台尺寸比例），与画笔绘制位置保持一致
  static const double _userHeadX = 0.27;
  static const double _npcHeadX = 0.73;
  static const double _headY = 0.46;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(builder: (context, constraints) {
      final w = constraints.maxWidth;
      final h = constraints.maxHeight;
      final userBubbles = widget.bubbles
          .where((b) => b.speaker == 'user')
          .toList()
          .reversed
          .take(2)
          .toList()
          .reversed
          .toList();
      final npcBubbles = widget.bubbles
          .where((b) => b.speaker == 'npc')
          .toList()
          .reversed
          .take(2)
          .toList()
          .reversed
          .toList();

      return ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // 3D 场景 + 角色
            AnimatedBuilder(
              animation: _idle,
              builder: (context, _) => CustomPaint(
                painter: _StagePainter(
                  environment: widget.environment,
                  idle: _idle.value,
                  userSpeaking: widget.speaking == 'user',
                  npcSpeaking: widget.speaking == 'npc',
                ),
              ),
            ),
            // 角色名牌
            Positioned(
              left: w * _userHeadX - 30,
              top: h * 0.84,
              child: _NameTag(name: widget.userName, highlight: false),
            ),
            Positioned(
              left: w * _npcHeadX - 30,
              top: h * 0.84,
              child: _NameTag(name: widget.npcName, highlight: true),
            ),
            // 头顶气泡：主角（左）
            if (userBubbles.isNotEmpty)
              Positioned(
                left: 10,
                right: w - w * _userHeadX - 8,
                bottom: h - h * _headY + 2,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    for (var i = 0; i < userBubbles.length; i++)
                      _StageBubble(
                        text: userBubbles[i].text,
                        isUser: true,
                        faded: i < userBubbles.length - 1,
                      ),
                  ],
                ),
              ),
            // 头顶气泡：NPC（右）
            if (npcBubbles.isNotEmpty)
              Positioned(
                left: w * _npcHeadX + 8,
                right: 10,
                bottom: h - h * _headY + 2,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    for (var i = 0; i < npcBubbles.length; i++)
                      _StageBubble(
                        text: npcBubbles[i].text,
                        isUser: false,
                        faded: i < npcBubbles.length - 1,
                      ),
                  ],
                ),
              ),
          ],
        ),
      );
    });
  }
}

/// 角色名牌
class _NameTag extends StatelessWidget {
  final String name;
  final bool highlight;

  const _NameTag({required this.name, required this.highlight});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 60,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: highlight ? const Color(0xEE2A2E45) : const Color(0xEE6C5CE7),
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.25),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        name,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

/// 头顶游戏式对话气泡（带尾巴）
class _StageBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final bool faded;

  const _StageBubble({
    required this.text,
    required this.isUser,
    this.faded = false,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isUser ? const Color(0xFF6C5CE7) : const Color(0xF2FFFFFF);
    final fg = isUser ? Colors.white : const Color(0xFF2D2A3E);
    return Opacity(
      opacity: faded ? 0.5 : 1,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: CustomPaint(
          painter: _BubbleTailPainter(isUser: isUser, color: bg),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: bg,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isUser ? 0.25 : 0.18),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Text(
              text,
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: fg,
                fontSize: 12,
                height: 1.35,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// 气泡小尾巴（指向头部）
class _BubbleTailPainter extends CustomPainter {
  final bool isUser;
  final Color color;

  _BubbleTailPainter({required this.isUser, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final cx = isUser ? size.width * 0.62 : size.width * 0.38;
    final path = Path()
      ..moveTo(cx - 5, size.height - 8)
      ..lineTo(cx, size.height + 1)
      ..lineTo(cx + 5, size.height - 8)
      ..close();
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _BubbleTailPainter oldDelegate) =>
      oldDelegate.isUser != isUser || oldDelegate.color != color;
}

/// 低多边形 3D 场景 + 双角色画笔
class _StagePainter extends CustomPainter {
  final StageEnvironment environment;
  final double idle; // 0..1 待机呼吸
  final bool userSpeaking;
  final bool npcSpeaking;

  _StagePainter({
    required this.environment,
    required this.idle,
    required this.userSpeaking,
    required this.npcSpeaking,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;
    final bob = (idle - 0.5) * 2; // -1..1

    _paintBackdrop(canvas, w, h);
    _paintFloor(canvas, w, h);
    _paintProps(canvas, w, h);
    _paintCharacter(
      canvas,
      center: Offset(w * 0.27, h * 0.9),
      scale: w / 420,
      bob: bob,
      speaking: userSpeaking,
      outfit: const Color(0xFF6C5CE7), // 主角品牌紫
      hair: const Color(0xFF2B2233),
      tie: null,
    );
    _paintCharacter(
      canvas,
      center: Offset(w * 0.73, h * 0.9),
      scale: w / 420,
      bob: bob * -0.7,
      speaking: npcSpeaking,
      outfit: const Color(0xFF2A2E45), // NPC 藏青西装
      hair: const Color(0xFF1B1B24),
      tie: const Color(0xFFE05656), // 红领带
    );
  }

  // ---------- 背景：墙体渐变 + 顶灯 ----------
  void _paintBackdrop(Canvas canvas, double w, double h) {
    late final List<Color> colors;
    switch (environment) {
      case StageEnvironment.office:
        colors = const [
          Color(0xFF4A5B8C),
          Color(0xFF8FA3CE),
          Color(0xFFC9D4EC)
        ];
      case StageEnvironment.cafe:
        colors = const [
          Color(0xFF5A3B2E),
          Color(0xFFA0714F),
          Color(0xFFD9B48C)
        ];
      case StageEnvironment.family:
        colors = const [
          Color(0xFF6B4632),
          Color(0xFFB07E55),
          Color(0xFFE7C79F)
        ];
      case StageEnvironment.restaurant:
        colors = const [
          Color(0xFF63262E),
          Color(0xFFA8454F),
          Color(0xFFD98A7C)
        ];
      case StageEnvironment.wedding:
        colors = const [
          Color(0xFFB48EC6),
          Color(0xFFE4C3DC),
          Color(0xFFFBEAF1)
        ];
      case StageEnvironment.bar:
        colors = const [
          Color(0xFF241B3A),
          Color(0xFF4A3268),
          Color(0xFF7554A0)
        ];
      case StageEnvironment.corridor:
        colors = const [
          Color(0xFF3E4550),
          Color(0xFF6B7482),
          Color(0xFF9AA3B0)
        ];
      case StageEnvironment.generic:
        colors = const [
          Color(0xFF5A4BDA),
          Color(0xFF8E84E8),
          Color(0xFFC9C4F5)
        ];
    }
    final rect = Rect.fromLTWH(0, 0, w, h);
    canvas.drawRect(
      rect,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: colors,
        ).createShader(rect),
    );
    // 顶部氛围光晕
    canvas.drawCircle(
      Offset(w * 0.5, h * 0.18),
      w * 0.45,
      Paint()
        ..shader = RadialGradient(colors: [
          Colors.white.withOpacity(0.18),
          Colors.white.withOpacity(0.0),
        ]).createShader(Rect.fromCircle(
          center: Offset(w * 0.5, h * 0.18),
          radius: w * 0.45,
        )),
    );
  }

  // ---------- 地面：透视梯形 + 反光 ----------
  void _paintFloor(Canvas canvas, double w, double h) {
    final floorTop = h * 0.58;
    final path = Path()
      ..moveTo(0, floorTop)
      ..lineTo(w, floorTop)
      ..lineTo(w, h)
      ..lineTo(0, h)
      ..close();
    late final Color floorA;
    late final Color floorB;
    switch (environment) {
      case StageEnvironment.wedding:
        floorA = const Color(0xFFE8B7CF);
        floorB = const Color(0xFFF7DCE8);
      case StageEnvironment.bar:
        floorA = const Color(0xFF1C1430);
        floorB = const Color(0xFF3A2A55);
      case StageEnvironment.cafe:
        floorA = const Color(0xFF7A4B33);
        floorB = const Color(0xFF9C6A4A);
      case StageEnvironment.corridor:
        floorA = const Color(0xFF4A5160);
        floorB = const Color(0xFF6C7484);
      default:
        floorA = const Color(0xFF3A4160);
        floorB = const Color(0xFF5A6488);
    }
    canvas.drawPath(
      path,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [floorB, floorA],
        ).createShader(Rect.fromLTWH(0, floorTop, w, h - floorTop)),
    );
    // 地面反光带
    canvas.drawPath(
      path,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.white.withOpacity(0.14),
            Colors.white.withOpacity(0.0),
          ],
        ).createShader(Rect.fromLTWH(0, floorTop, w, h * 0.2)),
    );
  }

  // ---------- 场景道具 ----------
  void _paintProps(Canvas canvas, double w, double h) {
    switch (environment) {
      case StageEnvironment.office:
        _officeProps(canvas, w, h);
      case StageEnvironment.cafe:
        _cafeProps(canvas, w, h);
      case StageEnvironment.family:
        _familyProps(canvas, w, h);
      case StageEnvironment.restaurant:
        _restaurantProps(canvas, w, h);
      case StageEnvironment.wedding:
        _weddingProps(canvas, w, h);
      case StageEnvironment.bar:
        _barProps(canvas, w, h);
      case StageEnvironment.corridor:
        _corridorProps(canvas, w, h);
      case StageEnvironment.generic:
        _genericProps(canvas, w, h);
    }
  }

  Rect _r(double x, double y, double ww, double hh) =>
      Rect.fromLTWH(x, y, ww, hh);

  void _fill(Canvas c, Rect r, Color color, {double radius = 6}) {
    c.drawRRect(RRect.fromRectAndRadius(r, Radius.circular(radius)),
        Paint()..color = color);
  }

  // 办公室：落地窗 + 办公桌 + 显示器 + 绿植
  void _officeProps(Canvas canvas, double w, double h) {
    // 落地窗（后墙）
    for (var i = 0; i < 3; i++) {
      final x = w * (0.08 + i * 0.3);
      _fill(canvas, _r(x, h * 0.14, w * 0.22, h * 0.4), const Color(0xCCDDE9FB),
          radius: 10);
      canvas.drawLine(
        Offset(x + w * 0.11, h * 0.14),
        Offset(x + w * 0.11, h * 0.54),
        Paint()
          ..color = const Color(0xFF8FA3CE)
          ..strokeWidth = 3,
      );
    }
    // 两张办公桌（左右后侧）
    _desk(canvas, Offset(w * 0.1, h * 0.56), w * 0.24);
    _desk(canvas, Offset(w * 0.66, h * 0.56), w * 0.24);
    // 顶灯
    _ceilingLamp(canvas, Offset(w * 0.3, 0), w * 0.16);
    _ceilingLamp(canvas, Offset(w * 0.7, 0), w * 0.16);
    // 绿植（左角）
    _plant(canvas, Offset(w * 0.03, h * 0.5), w * 0.1);
  }

  void _desk(Canvas canvas, Offset origin, double width) {
    _fill(canvas, _r(origin.dx, origin.dy, width, 8), const Color(0xFFB9C2D2));
    _fill(canvas, _r(origin.dx + width * 0.42, origin.dy + 8, 6, 18),
        const Color(0xFF6B7688));
    // 显示器
    _fill(canvas, _r(origin.dx + width * 0.18, origin.dy - 26, width * 0.5, 22),
        const Color(0xFF223049),
        radius: 4);
    _fill(canvas, _r(origin.dx + width * 0.38, origin.dy - 4, 10, 6),
        const Color(0xFF2A2F3A),
        radius: 2);
  }

  void _ceilingLamp(Canvas canvas, Offset origin, double width) {
    canvas.drawLine(
      Offset(origin.dx + width / 2, origin.dy),
      Offset(origin.dx + width / 2, origin.dy + 10),
      Paint()
        ..color = Colors.white.withOpacity(0.5)
        ..strokeWidth = 2,
    );
    _fill(canvas, _r(origin.dx, origin.dy + 10, width, 5),
        Colors.white.withOpacity(0.75),
        radius: 3);
  }

  void _plant(Canvas canvas, Offset origin, double size) {
    _fill(
        canvas,
        _r(origin.dx + size * 0.2, origin.dy + size * 0.5, size * 0.6,
            size * 0.5),
        const Color(0xFFA9603C),
        radius: 6);
    final leaf = Paint()..color = const Color(0xFF4E7D4E);
    canvas.drawCircle(Offset(origin.dx + size * 0.5, origin.dy + size * 0.35),
        size * 0.4, leaf);
    canvas.drawCircle(Offset(origin.dx + size * 0.25, origin.dy + size * 0.45),
        size * 0.3, leaf);
    canvas.drawCircle(Offset(origin.dx + size * 0.75, origin.dy + size * 0.45),
        size * 0.3, leaf);
  }

  // 咖啡厅：吧台 + 吊灯 + 展示柜
  void _cafeProps(Canvas canvas, double w, double h) {
    // 后墙展示柜
    _fill(canvas, _r(w * 0.32, h * 0.18, w * 0.36, h * 0.3),
        const Color(0xB37A4B33),
        radius: 10);
    for (var i = 0; i < 3; i++) {
      _fill(canvas, _r(w * (0.35 + i * 0.11), h * 0.24, w * 0.07, h * 0.08),
          const Color(0xFFE8D9C4),
          radius: 4);
    }
    // 吧台
    _fill(canvas, _r(w * 0.06, h * 0.56, w * 0.26, h * 0.05),
        const Color(0xFF8C5B3E),
        radius: 6);
    _fill(canvas, _r(w * 0.68, h * 0.56, w * 0.26, h * 0.05),
        const Color(0xFF8C5B3E),
        radius: 6);
    // 咖啡杯
    _fill(canvas, _r(w * 0.14, h * 0.5, 10, 8), const Color(0xFFEFEBE4),
        radius: 3);
    _fill(canvas, _r(w * 0.76, h * 0.5, 10, 8), const Color(0xFFEFEBE4),
        radius: 3);
    // 吊灯
    for (final x in [w * 0.2, w * 0.5, w * 0.8]) {
      canvas.drawLine(
          Offset(x, 0),
          Offset(x, h * 0.12),
          Paint()
            ..color = const Color(0xCC3A2417)
            ..strokeWidth = 2);
      final path = Path()
        ..moveTo(x - 14, h * 0.18)
        ..lineTo(x + 14, h * 0.18)
        ..lineTo(x + 8, h * 0.12)
        ..lineTo(x - 8, h * 0.12)
        ..close();
      canvas.drawPath(path, Paint()..color = const Color(0xFFE8B04B));
    }
  }

  // 家宴：餐桌 + 吊灯 + 边柜
  void _familyProps(Canvas canvas, double w, double h) {
    _fill(canvas, _r(w * 0.24, h * 0.56, w * 0.52, h * 0.05),
        const Color(0xFF9C6A3F),
        radius: 8);
    // 桌上餐具
    for (final x in [w * 0.32, w * 0.46, w * 0.6, w * 0.7]) {
      _fill(canvas, _r(x, h * 0.52, 10, 6), const Color(0xFFF4EFE6), radius: 3);
    }
    // 暖色吊灯
    for (final x in [w * 0.35, w * 0.65]) {
      canvas.drawLine(
          Offset(x, 0),
          Offset(x, h * 0.1),
          Paint()
            ..color = const Color(0xCC3A2417)
            ..strokeWidth = 2);
      final path = Path()
        ..moveTo(x - 16, h * 0.18)
        ..lineTo(x + 16, h * 0.18)
        ..lineTo(x + 9, h * 0.1)
        ..lineTo(x - 9, h * 0.1)
        ..close();
      canvas.drawPath(path, Paint()..color = const Color(0xFFD98E3A));
      canvas.drawCircle(
        Offset(x, h * 0.2),
        26,
        Paint()
          ..shader = RadialGradient(colors: [
            const Color(0xFFFFD9A0).withOpacity(0.35),
            const Color(0xFFFFD9A0).withOpacity(0.0),
          ]).createShader(
              Rect.fromCircle(center: Offset(x, h * 0.2), radius: 26)),
      );
    }
    // 边柜 + 相框
    _fill(canvas, _r(w * 0.02, h * 0.4, w * 0.12, h * 0.22),
        const Color(0xFF7A4B2E),
        radius: 8);
    _fill(canvas, _r(w * 0.04, h * 0.3, w * 0.08, h * 0.09),
        const Color(0xFFE7C79F),
        radius: 4);
    _fill(canvas, _r(w * 0.86, h * 0.4, w * 0.12, h * 0.22),
        const Color(0xFF7A4B2E),
        radius: 8);
  }

  // 餐厅宴请：圆桌 + 转盘 + 红灯笼
  void _restaurantProps(Canvas canvas, double w, double h) {
    // 圆桌（椭圆透视）
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.5, h * 0.6), width: w * 0.7, height: h * 0.12),
      Paint()..color = const Color(0xFF8C2F39),
    );
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.5, h * 0.58), width: w * 0.44, height: h * 0.07),
      Paint()..color = const Color(0xFFB0474F),
    );
    // 转盘玻璃反光
    canvas.drawOval(
      Rect.fromCenter(
          center: Offset(w * 0.44, h * 0.575),
          width: w * 0.16,
          height: h * 0.03),
      Paint()..color = Colors.white.withOpacity(0.22),
    );
    // 葡萄酒杯
    for (final x in [w * 0.3, w * 0.7]) {
      canvas.drawLine(
          Offset(x, h * 0.54),
          Offset(x, h * 0.5),
          Paint()
            ..color = const Color(0xFFE8D9C4)
            ..strokeWidth = 2);
      canvas.drawCircle(
          Offset(x, h * 0.485), 4, Paint()..color = const Color(0xFF8C1F3A));
    }
    // 红灯笼
    for (final x in [w * 0.18, w * 0.82]) {
      canvas.drawCircle(
          Offset(x, h * 0.14), 12, Paint()..color = const Color(0xFFE03A45));
      canvas.drawLine(
          Offset(x, h * 0.14 - 12),
          Offset(x, h * 0.06),
          Paint()
            ..color = const Color(0xCCF5A623)
            ..strokeWidth = 2);
    }
  }

  // 婚礼：花拱门 + 花瓣地毯
  void _weddingProps(Canvas canvas, double w, double h) {
    // 花瓣地毯
    final carpet = Path()
      ..moveTo(w * 0.34, h)
      ..lineTo(w * 0.66, h)
      ..lineTo(w * 0.58, h * 0.58)
      ..lineTo(w * 0.42, h * 0.58)
      ..close();
    canvas.drawPath(
      carpet,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.bottomCenter,
          end: Alignment.topCenter,
          colors: const [Color(0xFFEFB7D0), Color(0xFFF9DEE9)],
        ).createShader(Rect.fromLTWH(0, h * 0.58, w, h * 0.42)),
    );
    // 花拱门（后墙）
    final arch = Paint()
      ..color = Colors.white.withOpacity(0.85)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 10;
    canvas.drawArc(
      Rect.fromCenter(
          center: Offset(w * 0.5, h * 0.42), width: w * 0.62, height: h * 0.56),
      3.14,
      3.14,
      false,
      arch,
    );
    // 拱门上的花
    final rng = [0.2, 0.35, 0.5, 0.65, 0.8];
    for (var i = 0; i < rng.length; i++) {
      final t = rng[i];
      final ax = w * (0.5 + (t - 0.5) * 0.62);
      final ay = h * (0.42 - 0.28 * (1 - (2 * t - 1) * (2 * t - 1)));
      canvas.drawCircle(
          Offset(ax, ay), 7, Paint()..color = const Color(0xFFEF92B8));
      canvas.drawCircle(
          Offset(ax - 5, ay + 4), 4, Paint()..color = Colors.white);
    }
    // 花瓣
    for (var i = 0; i < 8; i++) {
      canvas.drawCircle(
        Offset(w * (0.15 + i * 0.1), h * (0.62 + (i % 3) * 0.08)),
        2.5,
        Paint()..color = const Color(0xFFF2BED1),
      );
    }
  }

  // 酒吧：霓虹灯带 + 吧台凳 + 酒瓶架
  void _barProps(Canvas canvas, double w, double h) {
    // 酒瓶架
    _fill(canvas, _r(w * 0.3, h * 0.16, w * 0.4, h * 0.28),
        const Color(0xB31C1430),
        radius: 10);
    for (var i = 0; i < 5; i++) {
      final x = w * (0.34 + i * 0.065);
      _fill(
          canvas,
          _r(x, h * 0.22, 8, h * 0.1),
          [
            const Color(0xFF7EC8E3),
            const Color(0xFFE8B04B),
            const Color(0xFFC0699E)
          ][i % 3],
          radius: 3);
    }
    // 吧台
    _fill(canvas, _r(w * 0.06, h * 0.56, w * 0.24, h * 0.05),
        const Color(0xFF3A2A55),
        radius: 6);
    _fill(canvas, _r(w * 0.7, h * 0.56, w * 0.24, h * 0.05),
        const Color(0xFF3A2A55),
        radius: 6);
    // 吧台凳
    for (final x in [w * 0.12, w * 0.22, w * 0.78, w * 0.88]) {
      _fill(canvas, _r(x - 6, h * 0.6, 12, 5), const Color(0xFF7554A0),
          radius: 3);
      canvas.drawLine(
          Offset(x, h * 0.65),
          Offset(x, h * 0.72),
          Paint()
            ..color = const Color(0xFF4A3268)
            ..strokeWidth = 2);
    }
    // 霓虹灯带
    final neon = Paint()
      ..color = const Color(0xFF7EC8E3)
      ..strokeWidth = 3
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);
    canvas.drawLine(Offset(w * 0.1, h * 0.5), Offset(w * 0.9, h * 0.5), neon);
    final neon2 = Paint()
      ..color = const Color(0xFFC0699E)
      ..strokeWidth = 2
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
    canvas.drawLine(
        Offset(w * 0.2, h * 0.53), Offset(w * 0.8, h * 0.53), neon2);
  }

  // 楼道：堆叠纸箱 + 顶灯
  void _corridorProps(Canvas canvas, double w, double h) {
    // 狭窄走廊墙面
    _fill(canvas, _r(0, h * 0.16, w * 0.14, h * 0.44), const Color(0xFF4A5160),
        radius: 0);
    _fill(canvas, _r(w * 0.86, h * 0.16, w * 0.14, h * 0.44),
        const Color(0xFF4A5160),
        radius: 0);
    // 堆叠纸箱（左右）
    _boxStack(canvas, Offset(w * 0.06, h * 0.5), w * 0.14, 3);
    _boxStack(canvas, Offset(w * 0.8, h * 0.52), w * 0.13, 2);
    // 顶灯
    _ceilingLamp(canvas, Offset(w * 0.28, h * 0.04), w * 0.14);
    _ceilingLamp(canvas, Offset(w * 0.58, h * 0.04), w * 0.14);
  }

  void _boxStack(Canvas canvas, Offset origin, double bw, int count) {
    for (var i = 0; i < count; i++) {
      _fill(
          canvas,
          _r(origin.dx + (i % 2) * 4, origin.dy - i * (bw * 0.62), bw,
              bw * 0.6),
          const Color(0xFFC9A36A),
          radius: 4);
      canvas.drawLine(
        Offset(origin.dx + (i % 2) * 4 + bw / 2, origin.dy - i * (bw * 0.62)),
        Offset(origin.dx + (i % 2) * 4 + bw / 2,
            origin.dy - i * (bw * 0.62) + bw * 0.6),
        Paint()
          ..color = const Color(0xFFA9824F)
          ..strokeWidth = 2,
      );
    }
  }

  // 通用：沙发 + 茶几 + 落地灯
  void _genericProps(Canvas canvas, double w, double h) {
    _fill(canvas, _r(w * 0.04, h * 0.5, w * 0.24, h * 0.1),
        const Color(0xFF4A4470),
        radius: 10);
    _fill(canvas, _r(w * 0.72, h * 0.5, w * 0.24, h * 0.1),
        const Color(0xFF4A4470),
        radius: 10);
    _fill(canvas, _r(w * 0.4, h * 0.58, w * 0.2, h * 0.05),
        const Color(0xFF8E84E8),
        radius: 6);
    _ceilingLamp(canvas, Offset(w * 0.4, 0), w * 0.2);
    _plant(canvas, Offset(w * 0.88, h * 0.44), w * 0.1);
  }

  // ---------- 角色：低多边形小人 ----------
  void _paintCharacter(
    Canvas canvas, {
    required Offset center, // 脚底中心
    required double scale,
    required double bob,
    required bool speaking,
    required Color outfit,
    required Color hair,
    Color? tie,
  }) {
    final s = scale.clamp(0.7, 1.4);
    final bodyH = 86 * s;
    final headR = 17 * s;
    final breathe = bob * 1.6 * s;
    final topY = center.dy - bodyH - headR * 2 + breathe;

    final shadow = Paint()
      ..color = Colors.black.withOpacity(0.22)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6);
    canvas.drawOval(
      Rect.fromCenter(center: center, width: 46 * s, height: 10 * s),
      shadow,
    );

    // 腿
    final legPaint = Paint()..color = const Color(0xFF2B2A38);
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(center.dx - 13 * s, center.dy - 30 * s, 10 * s, 30 * s),
        const Radius.circular(4),
      ),
      legPaint,
    );
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(center.dx + 3 * s, center.dy - 30 * s, 10 * s, 30 * s),
        const Radius.circular(4),
      ),
      legPaint,
    );

    // 身体（西装）
    final bodyPath = Path()
      ..moveTo(center.dx - 17 * s, center.dy - 28 * s)
      ..lineTo(center.dx + 17 * s, center.dy - 28 * s)
      ..lineTo(center.dx + 14 * s, center.dy - 92 * s + breathe)
      ..lineTo(center.dx - 14 * s, center.dy - 92 * s + breathe)
      ..close();
    canvas.drawPath(bodyPath, Paint()..color = outfit);
    // 领带
    if (tie != null) {
      final tiePath = Path()
        ..moveTo(center.dx - 3 * s, center.dy - 90 * s + breathe)
        ..lineTo(center.dx + 3 * s, center.dy - 90 * s + breathe)
        ..lineTo(center.dx + 2 * s, center.dy - 62 * s + breathe)
        ..lineTo(center.dx, center.dy - 56 * s + breathe)
        ..lineTo(center.dx - 2 * s, center.dy - 62 * s + breathe)
        ..close();
      canvas.drawPath(tiePath, Paint()..color = tie);
    }
    // 衬衫领口
    canvas.drawPath(
      Path()
        ..moveTo(center.dx - 6 * s, center.dy - 92 * s + breathe)
        ..lineTo(center.dx, center.dy - 84 * s + breathe)
        ..lineTo(center.dx + 6 * s, center.dy - 92 * s + breathe)
        ..close(),
      Paint()..color = Colors.white,
    );

    // 手臂：说话时抬起做手势
    final armPaint = Paint()
      ..color = outfit
      ..strokeWidth = 8 * s
      ..strokeCap = StrokeCap.round;
    final lift = speaking ? 14 * s : 0;
    canvas.drawLine(
      Offset(center.dx - 15 * s, center.dy - 86 * s + breathe),
      Offset(center.dx - 26 * s, center.dy - 62 * s + breathe - lift),
      armPaint,
    );
    canvas.drawLine(
      Offset(center.dx + 15 * s, center.dy - 86 * s + breathe),
      Offset(center.dx + 26 * s, center.dy - 62 * s + breathe - lift * 0.6),
      armPaint,
    );

    // 头
    final headCenter = Offset(center.dx, topY + headR);
    canvas.drawCircle(
        headCenter, headR, Paint()..color = const Color(0xFFF2C9A6));
    // 头发
    canvas.drawArc(
      Rect.fromCircle(center: headCenter, radius: headR),
      3.14,
      3.14,
      true,
      Paint()..color = hair,
    );
    // 眼睛
    canvas.drawCircle(
      Offset(headCenter.dx - 6 * s, headCenter.dy + 2 * s),
      1.8 * s,
      Paint()..color = const Color(0xFF2B2A38),
    );
    canvas.drawCircle(
      Offset(headCenter.dx + 6 * s, headCenter.dy + 2 * s),
      1.8 * s,
      Paint()..color = const Color(0xFF2B2A38),
    );
  }

  @override
  bool shouldRepaint(covariant _StagePainter oldDelegate) =>
      oldDelegate.idle != idle ||
      oldDelegate.environment != environment ||
      oldDelegate.userSpeaking != userSpeaking ||
      oldDelegate.npcSpeaking != npcSpeaking;
}

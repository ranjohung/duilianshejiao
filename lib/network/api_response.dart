/// 统一API响应模型
/// code=0表示成功，非0为业务错误码
class ApiResponse<T> {
  final int code;
  final String message;
  final T? data;

  ApiResponse({required this.code, required this.message, this.data});

  /// 请求是否成功
  bool get isSuccess => code == 0;

  /// 请求是否失败
  bool get isFail => !isSuccess;

  /// 从JSON构造
  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(dynamic)? fromJsonT,
  ) {
    return ApiResponse(
      code: json['code'] as int? ?? -1,
      message: json['message'] as String? ?? '',
      data: json['data'] != null && fromJsonT != null
          ? fromJsonT(json['data'])
          : null,
    );
  }

  /// 从列表JSON构造
  factory ApiResponse.fromJsonList(
    Map<String, dynamic> json,
    T Function(List<dynamic>) fromJsonT,
  ) {
    return ApiResponse(
      code: json['code'] as int? ?? -1,
      message: json['message'] as String? ?? '',
      data: json['data'] != null ? fromJsonT(json['data'] as List) : null,
    );
  }
}

/// 分页响应数据
class PaginatedData<T> {
  final List<T> items;
  final int total;
  final int page;
  final int pageSize;
  final bool hasMore;

  PaginatedData({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
  }) : hasMore = page * pageSize < total;

  factory PaginatedData.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    return PaginatedData(
      items: (json['items'] as List)
          .map((e) => fromJsonT(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 20,
    );
  }
}

import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'api_response.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  static ApiClient get instance => _instance;

  ApiClient._internal();

  final http.Client _client = http.Client();

  Future<Map<String, dynamic>> get(String path, {Map<String, String>? queryParameters}) async {
    var url = Uri.parse('${ApiConfig.baseUrl}$path');
    if (queryParameters != null) {
      url = url.replace(queryParameters: queryParameters);
    }
    final response = await _client.get(url);
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> post(String path, {Map<String, String>? headers, dynamic data}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _client.post(
      url,
      headers: headers ?? {'Content-Type': 'application/json'},
      body: data != null ? json.encode(data) : null,
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> put(String path, {Map<String, String>? headers, dynamic data}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _client.put(
      url,
      headers: headers ?? {'Content-Type': 'application/json'},
      body: data != null ? json.encode(data) : null,
    );
    return json.decode(response.body);
  }

  Future<Map<String, dynamic>> delete(String path, {Map<String, String>? headers}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$path');
    final response = await _client.delete(url, headers: headers);
    return json.decode(response.body);
  }
}

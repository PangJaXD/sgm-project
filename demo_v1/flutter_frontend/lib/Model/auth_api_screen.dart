import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import '../Service/api_exception.dart';

class AuthApiService {
  // Candidate URLs in priority order:
  // 1. localhost:8080 (works with `adb reverse tcp:8080 tcp:8080` for emulator on port 5555 / LDPlayer / Nox / AVD)
  // 2. 192.168.0.31:8080 (PC LAN IP - accessible from all emulators & physical devices on the same Wi-Fi)
  // 3. 10.0.2.2:8080 (Default Android Studio AVD gateway)
  static final List<String> _candidateUrls = Platform.isAndroid
      ? [
          'http://localhost:8080/api',
          'http://10.10.13.130:8080/api',
          'http://10.0.2.2:8080/api',
        ]
      : ['http://localhost:8080/api'];

  static String baseUrl = _candidateUrls.first;

  Dio _createDio(String url) {
    return Dio(
      BaseOptions(
        baseUrl: url,
        connectTimeout: const Duration(seconds: 4),
        receiveTimeout: const Duration(seconds: 6),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  Future<Response> login(String username, String password) async {
    DioException? lastDioError;

    // Try current baseUrl first, then try candidate URLs if connection fails or gets 404/502
    final urlsToTry = [baseUrl, ..._candidateUrls.where((u) => u != baseUrl)];

    for (final url in urlsToTry) {
      try {
        debugPrint('[AuthApiService] Attempting login at: $url/auth/login');
        final response = await _createDio(url).post(
          '/auth/login',
          data: {'username': username, 'password': password},
        );
        baseUrl = url;
        debugPrint(
          '[AuthApiService] Login connected successfully with baseUrl: $baseUrl',
        );
        return response;
      } on DioException catch (e) {
        lastDioError = e;
        // If the server answered with an intentional auth error from our backend (400, 401, 409),
        // it means we reached our Spring Boot backend. Handle this response immediately without trying other URLs.
        final status = e.response?.statusCode;
        if (status == 400 || status == 401 || status == 409) {
          baseUrl = url;
          _handleDioError(e);
        }
        debugPrint(
          '[AuthApiService] URL $url failed (${e.type}, status: $status). Trying next candidate...',
        );
      } catch (_) {
        // Try next candidate
      }
    }

    if (lastDioError != null) {
      _handleDioError(lastDioError);
    }
    throw ApiException(message: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
  }

  Never _handleDioError(DioException e) {
    throw ApiException.fromDioException(e);
  }
}

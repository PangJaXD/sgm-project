import 'dart:io';
import 'package:dio/dio.dart';

class AuthApiService {
  // On Android emulator, use 10.0.2.2 to reach host machine's localhost.
  // If running on a physical device, set this to your computer's LAN IP (e.g. 192.168.0.31).
  static String baseUrl = Platform.isAndroid
      ? 'http://10.0.2.2:8080/api'
      : 'http://localhost:8080/api';

  Dio _createDio(String url) {
    return Dio(
      BaseOptions(
        baseUrl: url,
        connectTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 8),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  Future<Response> login(String username, String password) async {
    try {
      return await _createDio(
        baseUrl,
      ).post('/auth/login', data: {'username': username, 'password': password});
    } on DioException catch (e) {
      // If 10.0.2.2 failed with connection error, try localhost:8080
      // (in case adb reverse tcp:8080 tcp:8080 is active)
      if (Platform.isAndroid &&
          baseUrl == 'http://10.0.2.2:8080/api' &&
          (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout)) {
        try {
          final res = await _createDio('http://localhost:8080/api').post(
            '/auth/login',
            data: {'username': username, 'password': password},
          );
          baseUrl = 'http://localhost:8080/api';
          return res;
        } catch (_) {
          // Fall back to original error
        }
      }

      _handleDioError(e);
    }
  }

  Never _handleDioError(DioException e) {
    if (e.response != null) {
      final data = e.response?.data;
      if (data is Map &&
          data['message'] != null &&
          data['message'].toString().trim().isNotEmpty) {
        throw Exception(data['message']);
      }
      if (data is String && data.trim().isNotEmpty) {
        throw Exception(data);
      }

      final status = e.response?.statusCode;
      if (status == 400 || status == 401 || status == 500) {
        throw Exception('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      }
      throw Exception('เซิร์ฟเวอร์ตอบกลับผิดพลาด (รหัสสถานะ: $status)');
    }

    if (e.type == DioExceptionType.connectionTimeout ||
        e.type == DioExceptionType.sendTimeout ||
        e.type == DioExceptionType.receiveTimeout) {
      throw Exception('การเชื่อมต่อเซิร์ฟเวอร์หมดเวลา (Connection Timeout)');
    }

    if (e.type == DioExceptionType.connectionError) {
      throw Exception(
        'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ที่ $baseUrl ได้ (ตรวจสอบว่าเปิด Backend แล้วหรือ IP ถูกต้อง)',
      );
    }

    throw Exception(e.message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
}

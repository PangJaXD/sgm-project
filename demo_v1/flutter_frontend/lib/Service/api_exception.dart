import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

/// Global API Exception representing structured errors returned from the Spring Boot backend
/// or network connectivity failures.
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final String? error;
  final String? path;
  final Map<String, dynamic>? fieldErrors;
  final dynamic rawData;

  ApiException({
    required this.message,
    this.statusCode,
    this.error,
    this.path,
    this.fieldErrors,
    this.rawData,
  });

  /// Factory constructor to convert any DioException into a clean, human-friendly ApiException
  factory ApiException.fromDioException(DioException e) {
    if (e.response != null) {
      final status = e.response?.statusCode;
      final data = e.response?.data;
      String extractedMessage = '';
      String? errTitle;
      String? errPath;
      Map<String, dynamic>? fields;

      if (data is Map<String, dynamic>) {
        if (data['message'] != null &&
            data['message'].toString().trim().isNotEmpty) {
          extractedMessage = data['message'].toString().trim();
        }
        if (data['error'] != null) {
          errTitle = data['error'].toString();
        }
        if (data['path'] != null) {
          errPath = data['path'].toString();
        }
        if (data['errors'] is Map<String, dynamic>) {
          fields = data['errors'] as Map<String, dynamic>;
        }
      } else if (data is String && data.trim().isNotEmpty) {
        extractedMessage = data.trim();
      }

      // If backend gave a descriptive message, use it unless it's generic English
      if (extractedMessage.isNotEmpty) {
        // Special case: translate standard Spring Security or internal errors to clean Thai
        final lower = extractedMessage.toLowerCase();
        if (lower.contains('username or password') ||
            lower.contains('bad credentials') ||
            lower.contains('unsupported user role')) {
          extractedMessage = 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง';
        }
        return ApiException(
          message: extractedMessage,
          statusCode: status,
          error: errTitle,
          path: errPath,
          fieldErrors: fields,
          rawData: data,
        );
      }

      // Fallback message by HTTP status code
      switch (status) {
        case 400:
          return ApiException(
            message: 'ข้อมูลที่ส่งมาไม่ถูกต้อง (Bad Request)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        case 401:
          return ApiException(
            message: 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือเซสชันหมดอายุ',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        case 403:
          return ApiException(
            message: 'คุณไม่มีสิทธิ์ในการเข้าถึงข้อมูลนี้ (Forbidden)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        case 404:
          return ApiException(
            message: 'ไม่พบข้อมูลที่ร้องขอในระบบ (Not Found)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        case 409:
          return ApiException(
            message:
                'ข้อมูลเกิดความขัดแย้งหรือมีข้อมูลซ้ำซ้อนในระบบ (Conflict)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        case 500:
          return ApiException(
            message:
                'ระบบเซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง (Internal Server Error)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        case 502:
        case 503:
        case 504:
          return ApiException(
            message:
                'ไม่สามารถติดต่อเซิร์ฟเวอร์ปลายทางได้ชั่วคราว (Service Unavailable)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
        default:
          return ApiException(
            message: 'เซิร์ฟเวอร์ตอบกลับผิดพลาด (รหัสสถานะ: $status)',
            statusCode: status,
            error: errTitle,
            rawData: data,
          );
      }
    }

    // Network and Client-side connectivity errors
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return ApiException(
          message:
              'การเชื่อมต่อเซิร์ฟเวอร์หมดเวลา (Connection Timeout) กรุณาตรวจสอบสัญญาณอินเทอร์เน็ต',
          error: 'TIMEOUT',
        );
      case DioExceptionType.connectionError:
        return ApiException(
          message:
              'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า Backend เปิดอยู่หรือไม่',
          error: 'CONNECTION_ERROR',
        );
      case DioExceptionType.cancel:
        return ApiException(
          message: 'การร้องขอข้อมูลถูกยกเลิก',
          error: 'CANCELLED',
        );
      case DioExceptionType.badCertificate:
        return ApiException(
          message: 'ใบรับรองความปลอดภัยเซิร์ฟเวอร์ไม่ถูกต้อง',
          error: 'BAD_CERTIFICATE',
        );
      default:
        return ApiException(
          message: e.message ?? 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
          error: 'UNKNOWN',
        );
    }
  }

  /// Extracts clean message from any exception
  static String extractMessage(dynamic error) {
    if (error is ApiException) {
      return error.message;
    }
    if (error is DioException) {
      return ApiException.fromDioException(error).message;
    }
    if (error is Exception) {
      return error.toString().replaceAll('Exception: ', '');
    }
    return error?.toString() ?? 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  /// Utility to show a modern, clean error SnackBar in UI
  static void showSnackBar(BuildContext context, dynamic error) {
    final msg = extractMessage(error);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(
              Icons.error_outline_rounded,
              color: Colors.white,
              size: 22,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                msg,
                style: const TextStyle(fontSize: 14, color: Colors.white),
              ),
            ),
          ],
        ),
        backgroundColor: const Color(0xFFEF4444),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  @override
  String toString() => message;
}

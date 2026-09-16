import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../Model/auth_api_screen.dart';
import './api_exception.dart';

class SituationReportItem {
  final int reportId;
  final int guardId;
  final int shiftId;
  final String reportType;
  final String urgency; // ด่วนมาก, ปานกลาง, ทั่วไป
  final String location;
  final String description;
  final bool isNormal;
  final String reportTime;
  final List<String> images;

  SituationReportItem({
    required this.reportId,
    required this.guardId,
    required this.shiftId,
    required this.reportType,
    required this.urgency,
    required this.location,
    required this.description,
    this.isNormal = true,
    required this.reportTime,
    this.images = const [],
  });

  factory SituationReportItem.fromJson(Map<String, dynamic> json) {
    return SituationReportItem(
      reportId: json['report_id'] ?? json['id'] ?? 0,
      guardId: json['guard_id'] ?? 0,
      shiftId: json['shift_id'] ?? 0,
      reportType: json['report_type'] ?? 'ทั่วไป',
      urgency:
          json['urgency'] ??
          (json['is_normal'] == false ? 'ด่วนมาก' : 'ทั่วไป'),
      location: json['location'] ?? '',
      description: json['report_desc'] ?? json['description'] ?? '',
      isNormal: json['is_normal'] == true || json['is_normal'] == 1,
      reportTime: json['report_time']?.toString() ?? '',
      images:
          (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          (json['report_img'] != null
              ? [json['report_img'].toString()]
              : const []),
    );
  }

  Map<String, dynamic> toJson() => {
    'report_id': reportId,
    'guard_id': guardId,
    'shift_id': shiftId,
    'report_type': reportType,
    'urgency': urgency,
    'location': location,
    'description': description,
    'is_normal': isNormal,
    'report_time': reportTime,
    'report_img': images.isNotEmpty ? images.first : 'default_report.jpg',
  };
}

class ReportService extends ChangeNotifier {
  static final ReportService instance = ReportService._internal();
  factory ReportService() => instance;
  ReportService._internal();

  final List<SituationReportItem> _submittedReports = [];
  List<SituationReportItem> get submittedReports =>
      List.unmodifiable(_submittedReports);

  Dio _createDio() {
    return Dio(
      BaseOptions(
        baseUrl: AuthApiService.baseUrl,
        connectTimeout: const Duration(seconds: 6),
        receiveTimeout: const Duration(seconds: 8),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  /// Submit report to Spring Boot MySQL database: POST /api/report
  Future<bool> submitReport({
    required int guardId,
    required int shiftId,
    required String reportType,
    required String urgency,
    required String location,
    required String description,
    required bool isNormal,
    List<String> images = const [],
  }) async {
    final now = DateTime.now();
    final timeStr =
        '${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')} น.';

    final reportItem = SituationReportItem(
      reportId: 0,
      guardId: guardId,
      shiftId: shiftId,
      reportType: reportType,
      urgency: urgency,
      location: location,
      description: description,
      isNormal: isNormal,
      reportTime: timeStr,
      images: images,
    );

    try {
      final response = await _createDio().post(
        '/report',
        data: {
          'guard_id': guardId,
          'shift_id': shiftId,
          'report_type': reportType,
          'description': description,
          'is_normal': isNormal,
          'report_img': images.isNotEmpty
              ? images.first
              : 'report_${now.millisecondsSinceEpoch}.jpg',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        _submittedReports.insert(0, reportItem);
        notifyListeners();
        return true;
      }
    } on DioException catch (e) {
      debugPrint('[ReportService] submitReport Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[ReportService] submitReport error: $e');
      throw ApiException(message: 'ไม่สามารถบันทึกรายงานสถานการณ์ได้');
    }

    return false;
  }

  /// Emergency SOS submission
  Future<bool> sendEmergencySOS({
    required int guardId,
    required int shiftId,
    required String location,
    String? note,
  }) async {
    return submitReport(
      guardId: guardId,
      shiftId: shiftId,
      reportType: 'เหตุฉุกเฉิน / SOS',
      urgency: 'ด่วนมาก',
      location: location,
      description:
          note ??
          'ส่งสัญญาณแจ้งขอความช่วยเหลือฉุกเฉินทันทีจากตำแหน่งปฏิบัติการ ($location)',
      isNormal: false,
    );
  }

  /// Fetch history of reports for this guard from backend: GET /api/report/guard/{guardId}
  Future<List<SituationReportItem>> fetchGuardReports(int guardId) async {
    try {
      final response = await _createDio().get('/report/guard/$guardId');
      if (response.statusCode == 200 && response.data is List) {
        final reports = (response.data as List)
            .map(
              (json) =>
                  SituationReportItem.fromJson(json as Map<String, dynamic>),
            )
            .toList();
        _submittedReports.clear();
        _submittedReports.addAll(reports);
        notifyListeners();
        return reports;
      }
    } on DioException catch (e) {
      debugPrint('[ReportService] fetchGuardReports Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[ReportService] fetchGuardReports error: $e');
    }
    return _submittedReports;
  }
}

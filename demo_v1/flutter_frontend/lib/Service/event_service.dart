import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../Model/auth_api_screen.dart';
import '../Model/assignment_model.dart';
import '../Model/working_history_model.dart';
import './api_exception.dart';

class ShiftTimeModel {
  final int shiftId;
  final int eventId;
  final String title;
  final DateTime? startTime;
  final DateTime? endTime;
  final DateTime? shiftDate;
  final int maximumGuards;
  final int currentGuards;
  final String dutyLocation;
  final String status; // OPEN, FULL, CLOSED

  ShiftTimeModel({
    required this.shiftId,
    this.eventId = 0,
    this.title = 'กะการทำงาน',
    this.startTime,
    this.endTime,
    this.shiftDate,
    this.maximumGuards = 10,
    this.currentGuards = 0,
    this.dutyLocation = 'จุดตรวจหลัก',
    this.status = 'OPEN',
  });

  factory ShiftTimeModel.fromJson(Map<String, dynamic> json) {
    final shiftIdVal = json['shift_id'] ?? json['id'] ?? 0;
    return ShiftTimeModel(
      shiftId: shiftIdVal,
      eventId: json['event_id'] ?? 0,
      title: json['title'] ?? json['event_name'] ?? 'กะงานที่ $shiftIdVal',
      startTime: json['start_time'] != null
          ? DateTime.tryParse(json['start_time'].toString())
          : null,
      endTime: json['end_time'] != null
          ? DateTime.tryParse(json['end_time'].toString())
          : null,
      shiftDate: json['shift_date'] != null
          ? DateTime.tryParse(json['shift_date'].toString())
          : null,
      maximumGuards: json['maximum_guards'] ?? 10,
      currentGuards: json['current_guards'] ?? 0,
      dutyLocation: json['duty_location'] ?? json['location'] ?? 'จุดตรวจหลัก',
      status: json['status'] ?? 'OPEN',
    );
  }

  int get availableSlots => (maximumGuards - currentGuards).clamp(0, 999);
  bool get isFull => availableSlots <= 0 || status.toUpperCase() == 'FULL';

  String get formattedTime {
    if (startTime == null || endTime == null) return '08:00 - 16:00 น.';
    final startHour = startTime!.hour.toString().padLeft(2, '0');
    final startMin = startTime!.minute.toString().padLeft(2, '0');
    final endHour = endTime!.hour.toString().padLeft(2, '0');
    final endMin = endTime!.minute.toString().padLeft(2, '0');
    return '$startHour:$startMin - $endHour:$endMin น.';
  }

  String get formattedDateThai {
    final d = shiftDate ?? startTime ?? DateTime.now();
    final thaiYear = d.year > 2500 ? d.year : d.year + 543;
    const months = [
      '',
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    return 'วันที่ ${d.day} ${months[d.month]} $thaiYear';
  }
}

class EventModel {
  final int id;
  final String title;
  final String location;
  final DateTime? startTime;
  final DateTime? endTime;
  final String? latitude;
  final String? longitude;
  final String contractor;
  final String contact;
  final String? eventImg;
  final String description;
  final DateTime? startDate;
  final DateTime? endDate;
  final String status;
  final List<String> requiredTools;
  final List<String> providedTools;
  final int requiredGuards;
  final List<ShiftTimeModel> shiftTimes;

  EventModel({
    required this.id,
    required this.title,
    required this.location,
    this.startTime,
    this.endTime,
    this.latitude,
    this.longitude,
    this.contractor = '',
    this.contact = '',
    this.eventImg,
    this.description = '',
    this.startDate,
    this.endDate,
    this.status = 'PENDING',
    this.requiredTools = const [],
    this.providedTools = const [],
    this.requiredGuards = 0,
    this.shiftTimes = const [],
  });

  factory EventModel.fromJson(Map<String, dynamic> json) {
    final DateTime? parsedStart = json['start_date'] != null
        ? DateTime.tryParse(json['start_date'].toString())
        : (json['startTime'] != null
              ? DateTime.tryParse(json['startTime'].toString())
              : null);
    final DateTime? parsedEnd = json['end_date'] != null
        ? DateTime.tryParse(json['end_date'].toString())
        : (json['endTime'] != null
              ? DateTime.tryParse(json['endTime'].toString())
              : null);

    final eventId = json['event_id'] ?? json['id'] ?? 0;

    List<ShiftTimeModel> shifts = [];
    if (json['shift_times'] != null && json['shift_times'] is Iterable) {
      shifts = (json['shift_times'] as Iterable)
          .map((e) => ShiftTimeModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return EventModel(
      id: eventId,
      title: json['event_name'] ?? json['title'] ?? 'ไม่มีชื่อกิจกรรม',
      location: json['location'] ?? 'ไม่ระบุสถานที่',
      startTime: parsedStart,
      endTime: parsedEnd,
      latitude: json['latitude']?.toString(),
      longitude: json['longitude']?.toString(),
      contractor: json['contractor']?.toString() ?? '',
      contact: json['contact']?.toString() ?? '',
      eventImg: json['event_img']?.toString(),
      description: json['event_detail'] ?? json['description'] ?? '',
      startDate: parsedStart,
      endDate: parsedEnd,
      status: json['status']?.toString() ?? 'PENDING',
      requiredTools:
          (json['required_tools'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      providedTools:
          (json['provided_tools'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      requiredGuards: json['required_guards'] ?? 0,
      shiftTimes: shifts,
    );
  }

  bool get isSpecialEvent {
    if (startDate != null && endDate != null && startDate != endDate) {
      return true;
    }
    return title.contains('อีเวนต์') ||
        title.contains('งาน') ||
        title.contains('มหาวิทยาลัย');
  }

  String get jobType => isSpecialEvent ? 'งานอีเวนต์พิเศษ' : 'งานประจำ';

  Color get tagBgColor =>
      isSpecialEvent ? const Color(0xFFFEF3C7) : const Color(0xFFDBEAFE);

  Color get tagTextColor =>
      isSpecialEvent ? const Color(0xFFD97706) : const Color(0xFF1D4ED8);

  Color get accentColor =>
      isSpecialEvent ? const Color(0xFFF59E0B) : const Color(0xFF2563EB);

  String get formattedDateRange {
    if (startDate == null) return '';
    final startYear = startDate!.year > 2500
        ? startDate!.year
        : startDate!.year + 543;
    final startStr =
        '${startDate!.day} ${WorkingHistoryModel.thaiMonths[startDate!.month]} $startYear';
    if (endDate == null || startDate == endDate) return startStr;
    final endYear = endDate!.year > 2500 ? endDate!.year : endDate!.year + 543;
    final endStr =
        '${endDate!.day} ${WorkingHistoryModel.thaiMonths[endDate!.month]} $endYear';
    return '$startStr - $endStr';
  }

  String get shiftTimeDisplay {
    if (shiftTimes.isNotEmpty) {
      return shiftTimes.map((s) => s.formattedTime).join(', ');
    }
    return '08:00 - 17:00 น.';
  }
}

class EventService {
  static final EventService instance = EventService._internal();
  factory EventService() => instance;
  EventService._internal();

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

  // Set of requested shift IDs by guard in current session
  final Set<int> requestedShiftIds = {};

  /// 1. Fetch all events from Spring Boot database: GET /api/events
  Future<List<EventModel>> fetchEvents({
    int? guardId,
    String? headName,
    String? company,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (guardId != null && guardId > 0) queryParams['guardId'] = guardId;
      if (headName != null && headName.trim().isNotEmpty) {
        queryParams['headName'] = headName.trim();
      }
      if (company != null && company.trim().isNotEmpty) {
        queryParams['company'] = company.trim();
      }

      final response = await _createDio().get(
        '/events',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('[EventService] fetchEvents Dio error: ${e.message}');
      // If error occurs, rethrow as ApiException for UI notification if needed
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[EventService] fetchEvents general error: $e');
      throw ApiException(message: 'ไม่สามารถดึงข้อมูลงานอีเวนต์ได้');
    }
    return [];
  }

  /// 2. Fetch shifts for a specific event: GET /api/events/{id}/shifts
  Future<List<ShiftTimeModel>> fetchEventShifts(
    int eventId, {
    int? guardId,
    String? headName,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (guardId != null && guardId > 0) queryParams['guardId'] = guardId;
      if (headName != null && headName.trim().isNotEmpty) {
        queryParams['headName'] = headName.trim();
      }

      final response = await _createDio().get(
        '/events/$eventId/shifts',
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map(
              (json) => ShiftTimeModel.fromJson(json as Map<String, dynamic>),
            )
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('[EventService] fetchEventShifts Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[EventService] fetchEventShifts error: $e');
      throw ApiException(message: 'ไม่สามารถดึงข้อมูลกะงานได้');
    }
    return [];
  }

  /// 3. Fetch active assignment for guard: GET /api/assignment/guard/{guardId}/active
  Future<AssignmentModel?> fetchActiveAssignment(int guardId) async {
    try {
      final response = await _createDio().get(
        '/assignment/guard/$guardId/active',
      );
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        return AssignmentModel.fromJson(response.data as Map<String, dynamic>);
      }
      if (response.statusCode == 204) {
        return null; // No active assignment
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404 || e.response?.statusCode == 204) {
        return null;
      }
      debugPrint(
        '[EventService] fetchActiveAssignment Dio error: ${e.message}',
      );
    } catch (e) {
      debugPrint('[EventService] fetchActiveAssignment error: $e');
    }
    return null;
  }

  /// 4. Fetch guard assignment by guardId (or fallback to active): GET /api/assignment/guard/{guardId}
  Future<AssignmentModel> fetchGuardAssignment(
    int guardId, {
    int? shiftId,
  }) async {
    try {
      final response = await _createDio().get('/assignment/guard/$guardId');
      if (response.statusCode == 200 && response.data is List) {
        final list = (response.data as List);
        if (list.isNotEmpty) {
          if (shiftId != null) {
            final match = list
                .where((item) => item['shift_id'] == shiftId)
                .firstOrNull;
            if (match != null) {
              return AssignmentModel.fromJson(match as Map<String, dynamic>);
            }
          } else {
            return AssignmentModel.fromJson(list.first as Map<String, dynamic>);
          }
        }
      }
    } on DioException catch (e) {
      debugPrint('[EventService] fetchGuardAssignment Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[EventService] fetchGuardAssignment error: $e');
      throw ApiException(message: 'ไม่สามารถดึงข้อมูลหน้าที่รับผิดชอบได้');
    }

    // Default empty assignment fallback if no DB records found
    return AssignmentModel(
      assignmentId: 0,
      guardId: guardId,
      shiftId: shiftId ?? 0,
      assignmentStatus: 'ยังไม่มีงาน',
      description: 'ยังไม่ได้รับมอบหมายหน้าที่',
      dutyLocation: 'ไม่ระบุ',
      eventName: 'ไม่มีกะงาน',
      shiftName: '-',
      shiftTime: '-',
    );
  }

  /// 5. Submit shift request: POST /api/assignment/request
  Future<bool> sendShiftRequest(int shiftId, int guardId) async {
    try {
      final response = await _createDio().post(
        '/assignment/request',
        data: {
          'shift_id': shiftId,
          'guard_id': guardId,
          'assignment_status': 'RESERVE',
        },
      );
      if (response.statusCode == 200 || response.statusCode == 201) {
        requestedShiftIds.add(shiftId);
        return true;
      }
    } on DioException catch (e) {
      debugPrint('[EventService] sendShiftRequest Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[EventService] sendShiftRequest error: $e');
      throw ApiException(message: 'ไม่สามารถส่งคำขอเข้าทำงานได้');
    }
    return false;
  }

  /// 6. Withdraw from shift: POST /api/assignment/withdraw
  Future<bool> withdrawShiftRequest({
    int? assignmentId,
    int? guardId,
    int? shiftId,
    required String reason,
    required String details,
  }) async {
    try {
      Response response;
      if (guardId != null && shiftId != null) {
        response = await _createDio().post(
          '/assignment/withdraw',
          data: {
            'guard_id': guardId,
            'shift_id': shiftId,
            'reason': reason,
            'details': details,
          },
        );
      } else {
        response = await _createDio().post(
          '/assignment/${assignmentId ?? shiftId}/withdraw',
          data: {
            'guard_id': ?guardId,
            'reason': reason,
            'details': details,
          },
        );
      }
      if (response.statusCode == 200) {
        if (shiftId != null) {
          requestedShiftIds.remove(shiftId);
        }
        return true;
      }
    } on DioException catch (e) {
      debugPrint('[EventService] withdrawShiftRequest Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[EventService] withdrawShiftRequest error: $e');
      throw ApiException(message: 'ไม่สามารถส่งคำร้องถอนตัวได้');
    }
    return false;
  }

  /// 7. Fetch working history: GET /api/guard/{guardId}/history
  Future<List<WorkingHistoryModel>> fetchWorkingHistory(int guardId) async {
    try {
      final response = await _createDio().get('/guard/$guardId/history');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map(
              (json) =>
                  WorkingHistoryModel.fromJson(json as Map<String, dynamic>),
            )
            .toList();
      }
    } on DioException catch (e) {
      debugPrint('[EventService] fetchWorkingHistory Dio error: ${e.message}');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[EventService] fetchWorkingHistory error: $e');
      throw ApiException(message: 'ไม่สามารถดึงประวัติการทำงานได้');
    }
    return [];
  }
}

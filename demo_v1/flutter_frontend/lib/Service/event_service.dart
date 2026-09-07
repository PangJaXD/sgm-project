import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../Model/auth_api_screen.dart';

class ShiftTimeModel {
  final int shiftId;
  final DateTime? startTime;
  final DateTime? endTime;
  final int maximumGuards;

  ShiftTimeModel({
    required this.shiftId,
    this.startTime,
    this.endTime,
    this.maximumGuards = 0,
  });

  factory ShiftTimeModel.fromJson(Map<String, dynamic> json) {
    return ShiftTimeModel(
      shiftId: json['shift_id'] ?? 0,
      startTime: json['start_time'] != null
          ? DateTime.tryParse(json['start_time'].toString())
          : null,
      endTime: json['end_time'] != null
          ? DateTime.tryParse(json['end_time'].toString())
          : null,
      maximumGuards: json['maximum_guards'] ?? 0,
    );
  }

  String get formattedTime {
    if (startTime == null || endTime == null) return 'ไม่ระบุเวลา';
    final startHour = startTime!.hour.toString().padLeft(2, '0');
    final startMin = startTime!.minute.toString().padLeft(2, '0');
    final endHour = endTime!.hour.toString().padLeft(2, '0');
    final endMin = endTime!.minute.toString().padLeft(2, '0');
    return '$startHour:$startMin - $endHour:$endMin น.';
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

    return EventModel(
      id: json['event_id'] ?? json['id'] ?? 0,
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
      shiftTimes:
          (json['shift_times'] as List<dynamic>?)
              ?.map((e) => ShiftTimeModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
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
    final startStr = '${startDate!.day}/${startDate!.month}/${startDate!.year}';
    if (endDate == null || startDate == endDate) return startStr;
    final endStr = '${endDate!.day}/${endDate!.month}/${endDate!.year}';
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

  Future<List<EventModel>> fetchEvents() async {
    try {
      final response = await _createDio(AuthApiService.baseUrl).get('/events');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => EventModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } on DioException catch (e) {
      // Fallback for Android emulator (10.0.2.2 <-> localhost)
      if (Platform.isAndroid &&
          AuthApiService.baseUrl.contains('10.0.2.2') &&
          (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout)) {
        try {
          final res = await _createDio(
            'http://localhost:8080/api',
          ).get('/events');
          if (res.statusCode == 200 && res.data is List) {
            AuthApiService.baseUrl = 'http://localhost:8080/api';
            return (res.data as List)
                .map(
                  (json) => EventModel.fromJson(json as Map<String, dynamic>),
                )
                .toList();
          }
        } catch (_) {}
      }
      throw Exception('ไม่สามารถดึงข้อมูลงานได้ (${e.message})');
    }
  }
}

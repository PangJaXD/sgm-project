import 'package:flutter/material.dart';

enum NotificationType {
  sos,
  urgent,
  teamReport,
  approval,
  announcement,
  info;

  static NotificationType fromString(String? type) {
    switch (type?.toLowerCase()) {
      case 'sos':
      case 'emergency':
        return NotificationType.sos;
      case 'urgent':
      case 'warning':
      case 'alert':
        return NotificationType.urgent;
      case 'team':
      case 'team_report':
      case 'teamreport':
      case 'report':
        return NotificationType.teamReport;
      case 'approval':
      case 'approved':
      case 'success':
        return NotificationType.approval;
      case 'announcement':
      case 'broadcast':
      case 'notice':
        return NotificationType.announcement;
      default:
        return NotificationType.info;
    }
  }
}

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final DateTime timestamp;
  final NotificationType type;
  final bool isRead;
  final Map<String, dynamic> data;

  const NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.timestamp,
    this.type = NotificationType.info,
    this.isRead = false,
    this.data = const {},
  });

  bool get isHighPriority =>
      type == NotificationType.sos ||
      type == NotificationType.urgent ||
      (isTeamReport && urgency == 'ด่วนมาก');

  bool get isUrgent => isHighPriority;

  bool get isTeamReport =>
      type == NotificationType.teamReport ||
      data['type'] == 'team_report' ||
      data['type'] == 'team' ||
      data.containsKey('report_type');

  String? get reportType =>
      data['report_type']?.toString() ??
      (isTeamReport ? 'รายงานทั่วไป' : null);

  String? get urgency => data['urgency']?.toString();

  String? get location => data['location']?.toString();

  String? get reportDescription =>
      data['description']?.toString() ??
      data['report_desc']?.toString() ??
      (isTeamReport ? body : null);

  String? get guardName => data['guard_name']?.toString();

  String? get guardPhone => data['guard_phone']?.toString();

  String? get eventName => data['event_name']?.toString();

  List<String> get images {
    final List<String> list = [];
    if (data['images'] is List) {
      for (final item in data['images'] as List) {
        if (item != null && item.toString().isNotEmpty) {
          list.add(item.toString());
        }
      }
    } else if (data['images'] is String && data['images'].toString().isNotEmpty) {
      list.add(data['images'].toString());
    }

    if (data['local_images'] is List) {
      for (final item in data['local_images'] as List) {
        if (item != null && item.toString().isNotEmpty && !list.contains(item.toString())) {
          list.add(item.toString());
        }
      }
    }

    if (data['report_img'] != null &&
        data['report_img'].toString().isNotEmpty &&
        !list.contains(data['report_img'].toString()) &&
        data['report_img'] != 'default_report.jpg') {
      list.add(data['report_img'].toString());
    }
    return list;
  }

  NotificationItem copyWith({
    String? id,
    String? title,
    String? body,
    DateTime? timestamp,
    NotificationType? type,
    bool? isRead,
    Map<String, dynamic>? data,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      timestamp: timestamp ?? this.timestamp,
      type: type ?? this.type,
      isRead: isRead ?? this.isRead,
      data: data ?? this.data,
    );
  }

  // Visual styling helpers matching the UI mockup
  IconData get icon {
    switch (type) {
      case NotificationType.sos:
        return Icons.emergency_rounded;
      case NotificationType.urgent:
        return Icons.warning_rounded;
      case NotificationType.teamReport:
        return Icons.shield_outlined;
      case NotificationType.approval:
        return Icons.done_all_rounded;
      case NotificationType.announcement:
        return Icons.campaign_rounded;
      case NotificationType.info:
        return Icons.notifications_active_rounded;
    }
  }

  Color get iconColor {
    switch (type) {
      case NotificationType.sos:
        return const Color(0xFFDC2626); // Strong Red
      case NotificationType.urgent:
        return const Color(0xFFEF4444); // Red
      case NotificationType.teamReport:
        if (urgency == 'ด่วนมาก') {
          return const Color(0xFFDC2626);
        } else if (urgency == 'ปานกลาง') {
          return const Color(0xFFF97316);
        }
        return const Color(0xFF2563EB); // Team Blue / Amber
      case NotificationType.approval:
        return const Color(0xFF16A34A); // Green
      case NotificationType.announcement:
        return const Color(0xFF2563EB); // Blue
      case NotificationType.info:
        return const Color(0xFF6366F1); // Indigo
    }
  }

  Color get iconBgColor {
    switch (type) {
      case NotificationType.sos:
        return const Color(0xFFFFE4E6); // Light Rose Red
      case NotificationType.urgent:
        return const Color(0xFFFEE2E2); // Light Red / Pink
      case NotificationType.teamReport:
        if (urgency == 'ด่วนมาก') {
          return const Color(0xFFFEE2E2);
        } else if (urgency == 'ปานกลาง') {
          return const Color(0xFFFFEDD5);
        }
        return const Color(0xFFDBEAFE); // Light Team Blue
      case NotificationType.approval:
        return const Color(0xFFDCFCE7); // Light Green
      case NotificationType.announcement:
        return const Color(0xFFDBEAFE); // Light Blue
      case NotificationType.info:
        return const Color(0xFFEEF2FF); // Light Indigo
    }
  }


  // Relative Thai time formatting
  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inSeconds < 60) {
      return 'เมื่อสักครู่';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes} นาทีที่แล้ว';
    } else if (difference.inHours < 24) {
      return '${difference.inHours} ชม. ที่แล้ว';
    } else if (difference.inDays == 1) {
      return 'เมื่อวานนี้';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} วันที่แล้ว';
    } else {
      return '${timestamp.day}/${timestamp.month}/${timestamp.year}';
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'timestamp': timestamp.toIso8601String(),
      'type': type.name,
      'isRead': isRead,
      'data': data,
    };
  }

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    return NotificationItem(
      id: json['id'] as String? ?? UniqueKey().toString(),
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'] as String) ?? DateTime.now()
          : DateTime.now(),
      type: NotificationType.fromString(json['type'] as String?),
      isRead: json['isRead'] as bool? ?? false,
      data: (json['data'] as Map<String, dynamic>?) ?? {},
    );
  }
}


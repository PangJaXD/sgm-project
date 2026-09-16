import 'package:flutter/material.dart';

enum NotificationType {
  urgent,
  approval,
  announcement,
  info;

  static NotificationType fromString(String? type) {
    switch (type?.toLowerCase()) {
      case 'urgent':
      case 'warning':
      case 'alert':
        return NotificationType.urgent;
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
      case NotificationType.urgent:
        return Icons.warning_rounded;
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
      case NotificationType.urgent:
        return const Color(0xFFEF4444); // Red
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
      case NotificationType.urgent:
        return const Color(0xFFFEE2E2); // Light Red / Pink
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


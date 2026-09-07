import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../Model/notification_model.dart';

// Top-level background message handler required by FCM
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (_) {}
  debugPrint('[FCM Background] Message received: ${message.messageId}');
}

class NotificationService extends ChangeNotifier {
  static final NotificationService instance = NotificationService._internal();

  factory NotificationService() => instance;

  NotificationService._internal() {
    _initializeDefaultMockNotifications();
  }

  String? _fcmToken;
  String? get fcmToken => _fcmToken;

  bool _isFirebaseInitialized = false;
  bool get isFirebaseInitialized => _isFirebaseInitialized;

  final List<NotificationItem> _notifications = [];
  List<NotificationItem> get notifications => List.unmodifiable(_notifications);

  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  void _initializeDefaultMockNotifications() {
    final now = DateTime.now();
    _notifications.addAll([
      NotificationItem(
        id: 'mock-1',
        title: 'อัปเดตจุดตรวจด่วน!',
        body:
            'มีการเปลี่ยนแปลงจุดเดินตรวจบริเวณประตูหลัก กรุณาตรวจสอบ View Assignment ในระบบ',
        timestamp: now.subtract(const Duration(minutes: 10)),
        type: NotificationType.urgent,
        isRead: false,
      ),
      NotificationItem(
        id: 'mock-2',
        title: 'อนุมัติคำร้องรับกะงาน',
        body:
            'คำร้องเข้าทำงานรอบดึก (16:00) ของคุณได้รับการอนุมัติเรียบร้อยแล้ว',
        timestamp: now.subtract(const Duration(hours: 2)),
        type: NotificationType.approval,
        isRead: true,
      ),
      NotificationItem(
        id: 'mock-3',
        title: 'ประกาศจากฝ่ายบุคคล',
        body:
            'ขอให้เจ้าหน้าที่ทุกท่านทำการอัปเดตแอปพลิเคชัน SGM เป็นเวอร์ชันล่าสุดเพื่อการใช้งานที่เสถียรขึ้น',
        timestamp: now.subtract(const Duration(days: 1)),
        type: NotificationType.announcement,
        isRead: true,
      ),
    ]);
  }

  // Initialize Firebase and FCM listeners
  Future<void> init() async {
    try {
      await Firebase.initializeApp();
      _isFirebaseInitialized = true;
      debugPrint('[Firebase] Initialized successfully');

      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      final messaging = FirebaseMessaging.instance;

      // 1. Request user permission
      NotificationSettings settings = await messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );
      debugPrint('[FCM] Permission status: ${settings.authorizationStatus}');

      // 2. Fetch FCM registration token
      try {
        _fcmToken = await messaging.getToken();
        debugPrint('====================================================');
        debugPrint('[FCM] Device Token:');
        debugPrint('$_fcmToken');
        debugPrint('====================================================');
      } catch (e) {
        debugPrint('[FCM] Failed to get device token: $e');
      }

      // 3. Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        debugPrint('[FCM] Device Token refreshed: $newToken');
      });

      // 4. Subscribe to broadcast topics
      try {
        await messaging.subscribeToTopic('all_guards');
        await messaging.subscribeToTopic('announcements');
      } catch (e) {
        debugPrint('[FCM] Topic subscription note: $e');
      }

      // 5. Handle foreground notifications
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint(
          '[FCM] Foreground notification: ${message.notification?.title}',
        );
        _handleRemoteMessage(message);
      });

      // 6. Handle notification click when app is opened from background
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint(
          '[FCM] Notification opened app: ${message.notification?.title}',
        );
        _handleRemoteMessage(message);
      });

      // 7. Check if app was opened directly by tapping a notification from terminated state
      RemoteMessage? initialMessage = await messaging.getInitialMessage();
      if (initialMessage != null) {
        _handleRemoteMessage(initialMessage);
      }
    } catch (e) {
      debugPrint('[NotificationService] Init error/fallback: $e');
    }
  }

  void _handleRemoteMessage(RemoteMessage message) {
    final title =
        message.notification?.title ??
        message.data['title'] ??
        'การแจ้งเตือนใหม่';
    final body = message.notification?.body ?? message.data['body'] ?? '';
    final typeString = message.data['type'] as String?;
    final type = NotificationType.fromString(typeString);

    final item = NotificationItem(
      id: message.messageId ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: title,
      body: body,
      timestamp: message.sentTime ?? DateTime.now(),
      type: type,
      isRead: false,
      data: message.data,
    );

    addNotification(item);
  }

  // State manipulation methods
  void addNotification(NotificationItem item) {
    _notifications.insert(0, item);
    notifyListeners();
  }

  void markAsRead(String id) {
    final index = _notifications.indexWhere((n) => n.id == id);
    if (index != -1 && !_notifications[index].isRead) {
      _notifications[index] = _notifications[index].copyWith(isRead: true);
      notifyListeners();
    }
  }

  void markAllAsRead() {
    bool changed = false;
    for (int i = 0; i < _notifications.length; i++) {
      if (!_notifications[i].isRead) {
        _notifications[i] = _notifications[i].copyWith(isRead: true);
        changed = true;
      }
    }
    if (changed) {
      notifyListeners();
    }
  }

  void deleteNotification(String id) {
    _notifications.removeWhere((n) => n.id == id);
    notifyListeners();
  }

  void clearAll() {
    _notifications.clear();
    notifyListeners();
  }

  // Quick simulation helper for instant UI testing
  void simulateTestNotification({
    String title = 'คำร้องได้รับการอนุมัติ',
    String body = 'คำร้องขอปฏิบัติหน้าที่ได้รับการยืนยันแล้ว',
    NotificationType type = NotificationType.approval,
  }) {
    addNotification(
      NotificationItem(
        id: 'sim-${DateTime.now().millisecondsSinceEpoch}',
        title: title,
        body: body,
        timestamp: DateTime.now(),
        type: type,
        isRead: false,
      ),
    );
  }
}

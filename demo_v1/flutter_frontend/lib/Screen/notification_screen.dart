import 'dart:io';
import 'package:flutter/material.dart';
import '../Model/auth_api_screen.dart';
import '../Model/notification_model.dart';
import '../Service/event_service.dart';
import '../Service/notification_service.dart';
import '../Service/user_service.dart';
import './assignment_detail_screen.dart';
import './shift_detail_screen.dart';

class NotificationScreen extends StatefulWidget {
  final bool isTab;
  final VoidCallback? onBack;

  const NotificationScreen({super.key, this.isTab = false, this.onBack});

  @override
  State<NotificationScreen> createState() => _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {
  final NotificationService _service = NotificationService.instance;

  @override
  void initState() {
    super.initState();
    _service.addListener(_onServiceUpdate);
    if (_service.notifications.isEmpty) {
      _service.populateSampleNotifications();
    }
  }

  @override
  void dispose() {
    _service.removeListener(_onServiceUpdate);
    super.dispose();
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  List<NotificationItem> _getSortedNotifications() {
    final list = List<NotificationItem>.from(_service.notifications);
    list.sort((a, b) {
      // 1. Sort by urgency level descending (SOS/Emergency -> Urgent/Critical -> Medium -> Normal/Info)
      final urgencyComparison = b.urgencyWeight.compareTo(a.urgencyWeight);
      if (urgencyComparison != 0) return urgencyComparison;
      // 2. Sort by timestamp descending (newest first)
      return b.timestamp.compareTo(a.timestamp);
    });
    return list;
  }

  void _handleBack() {
    if (widget.onBack != null) {
      widget.onBack!();
    } else if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  void _showTeamReportNotificationDetail(NotificationItem item) {
    _service.markAsRead(item.id);

    final isCritical = item.isHighPriority || item.urgency == 'ด่วนมาก';
    final isMedium = item.urgency == 'ปานกลาง';
    final urgencyColor = isCritical
        ? const Color(0xFFEF4444)
        : (isMedium ? const Color(0xFFF97316) : const Color(0xFF2563EB));
    final urgencyBg = isCritical
        ? const Color(0xFFFEE2E2)
        : (isMedium ? const Color(0xFFFFEDD5) : const Color(0xFFDBEAFE));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) => DraggableScrollableSheet(
        initialChildSize: 0.85,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (_, scrollController) => Container(
          padding: const EdgeInsets.fromLTRB(22, 16, 22, 32),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: ListView(
            controller: scrollController,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              const SizedBox(height: 18),

              // Header: Icon + Category + Team Badge + Urgency
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: urgencyBg,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isCritical
                          ? Icons.warning_rounded
                          : (isMedium
                              ? Icons.error_outline_rounded
                              : Icons.shield_outlined),
                      color: urgencyColor,
                      size: 28,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(
                                  color: const Color(0xFFBFDBFE),
                                ),
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.shield_outlined,
                                    size: 13,
                                    color: Color(0xFF2563EB),
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    'รายงานจากทีม',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF2563EB),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (item.urgency != null &&
                                item.urgency!.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: urgencyBg,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  item.urgency!,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: urgencyColor,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          item.reportType ?? item.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item.timeAgo,
                          style: const TextStyle(
                            fontSize: 12.5,
                            color: Color(0xFF64748B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              const Divider(),
              const SizedBox(height: 14),

              // Reporter & Location Info Box
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ข้อมูลผู้รายงานและพื้นที่',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF334155),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _buildDetailRow(
                      icon: Icons.category_rounded,
                      label: 'ประเภทรายงาน:',
                      value: (item.reportType != null && item.reportType!.isNotEmpty)
                          ? item.reportType!
                          : item.title,
                    ),
                    const SizedBox(height: 8),
                    _buildDetailRow(
                      icon: Icons.person_rounded,
                      label: 'เจ้าหน้าที่:',
                      value: (item.guardName != null && item.guardName!.isNotEmpty)
                          ? item.guardName!
                          : 'เจ้าหน้าที่ รปภ.',
                    ),
                    if (item.guardPhone != null &&
                        item.guardPhone!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        icon: Icons.phone_rounded,
                        label: 'เบอร์ติดต่อ:',
                        value: item.guardPhone!,
                      ),
                    ],
                    if (item.eventName != null &&
                        item.eventName!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        icon: Icons.event_rounded,
                        label: 'งาน/อีเวนต์:',
                        value: item.eventName!,
                      ),
                    ],
                    if (item.location != null &&
                        item.location!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      _buildDetailRow(
                        icon: Icons.location_on_rounded,
                        label: 'จุดเกิดเหตุ:',
                        value: item.location!,
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 18),

              // Description Box
              const Text(
                'รายละเอียดสถานการณ์',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Text(
                  (item.reportDescription != null &&
                          item.reportDescription!.isNotEmpty)
                      ? item.reportDescription!
                      : item.body,
                  style: const TextStyle(
                    fontSize: 14.5,
                    color: Color(0xFF334155),
                    height: 1.5,
                  ),
                ),
              ),

              // Image Gallery
              if (item.images.isNotEmpty) ...[
                const SizedBox(height: 20),
                Row(
                  children: [
                    const Icon(
                      Icons.photo_library_rounded,
                      size: 18,
                      color: Color(0xFF2563EB),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'รูปภาพหลักฐาน (${item.images.length} รูป)',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  height: 130,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: item.images.length,
                    separatorBuilder: (ctx, idx) =>
                        const SizedBox(width: 12),
                    itemBuilder: (ctx, i) {
                      final raw = item.images[i];
                      return GestureDetector(
                        onTap: () => _showFullImagePreview(raw),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(14),
                          child: Container(
                            width: 130,
                            height: 130,
                            color: const Color(0xFFF1F5F9),
                            child: _buildEvidenceImageThumbnail(raw, size: 130),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],

              const SizedBox(height: 28),

              SizedBox(
                width: double.infinity,
                height: 48,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(sheetCtx),
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    'รับทราบรายงาน / ปิด',
                    style: TextStyle(
                      color: Color(0xFF475569),
                      fontSize: 15.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showNotificationDetail(NotificationItem item) {
    _service.markAsRead(item.id);
    final user = UserService().currentUser;

    // If this is a team report notification, show the rich team report sheet
    if (item.isTeamReport) {
      _showTeamReportNotificationDetail(item);
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 5,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Container(
                  width: 52,
                  height: 52,
                  decoration: BoxDecoration(
                    color: item.iconBgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(item.icon, color: item.iconColor, size: 28),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.timeAgo,
                        style: TextStyle(
                          fontSize: 13,
                          color: (!item.isRead || item.isUrgent)
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF94A3B8),
                          fontWeight: (!item.isRead || item.isUrgent)
                              ? FontWeight.w600
                              : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 12),
            Text(
              item.body,
              style: const TextStyle(
                fontSize: 15,
                color: Color(0xFF475569),
                height: 1.6,
              ),
            ),
            if (item.data.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ข้อมูลเพิ่มเติม',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF475569),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...item.data.entries
                        .where((e) =>
                            e.key != 'type' &&
                            e.key != 'images' &&
                            e.key != 'local_images' &&
                            e.value != null &&
                            e.value.toString().isNotEmpty)
                        .map((e) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${e.key}: ',
                                    style: const TextStyle(
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                  Expanded(
                                    child: Text(
                                      e.value.toString(),
                                      style: const TextStyle(
                                        fontSize: 12.5,
                                        color: Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            )),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 24),
            if (item.body.contains('Assignment') ||
                item.title.contains('จุดตรวจ')) ...[
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                                    final activeAssign = await EventService.instance
                        .fetchActiveAssignment(user.usersId);
                    if (!context.mounted) return;
                    if (activeAssign != null) {
                      final event = EventModel(
                        id: activeAssign.eventId ?? activeAssign.shiftId,
                        title: activeAssign.eventName.isNotEmpty
                            ? activeAssign.eventName
                            : 'งานรักษาความปลอดภัย',
                        location: activeAssign.dutyLocation.isNotEmpty
                            ? activeAssign.dutyLocation
                            : 'จุดตรวจหลัก',
                      );
                      final shift = ShiftTimeModel(
                        shiftId: activeAssign.shiftId,
                        title: activeAssign.shiftName.isNotEmpty
                            ? activeAssign.shiftName
                            : activeAssign.eventName,
                        dutyLocation: activeAssign.dutyLocation,
                      );
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => AssignmentDetailScreen(
                            event: event,
                            shift: shift,
                            assignment: activeAssign,
                          ),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('ไม่พบข้อมูลกะงานที่มอบหมายในขณะนี้'),
                        ),
                      );
                    }
                  },
                  icon: const Icon(
                    Icons.pin_drop_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                  label: const Text(
                    'เปิดดูหน้าที่รับผิดชอบ (View Assignment)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ] else if (item.type == NotificationType.approval ||
                item.title.contains('กะงาน')) ...[
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                                    final activeAssign = await EventService.instance
                        .fetchActiveAssignment(user.usersId);
                    if (!context.mounted) return;
                    if (activeAssign != null) {
                      final event = EventModel(
                        id: activeAssign.eventId ?? activeAssign.shiftId,
                        title: activeAssign.eventName.isNotEmpty
                            ? activeAssign.eventName
                            : 'งานรักษาความปลอดภัย',
                        location: activeAssign.dutyLocation.isNotEmpty
                            ? activeAssign.dutyLocation
                            : 'จุดตรวจหลัก',
                      );
                      final shift = ShiftTimeModel(
                        shiftId: activeAssign.shiftId,
                        title: activeAssign.shiftName.isNotEmpty
                            ? activeAssign.shiftName
                            : activeAssign.eventName,
                        dutyLocation: activeAssign.dutyLocation,
                      );
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              ShiftDetailScreen(event: event, shift: shift),
                        ),
                      );
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text(
                            'ไม่พบข้อมูลกะงานที่กำลังปฏิบัติหน้าที่ในขณะนี้',
                          ),
                        ),
                      );
                    }
                  },
                  icon: const Icon(
                    Icons.assignment_turned_in_rounded,
                    color: Colors.white,
                    size: 18,
                  ),
                  label: const Text(
                    'ดูกะงานที่ได้รับมอบหมาย (View Shift)',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 10),
            ],
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text(
                  'รับทราบ / ปิด',
                  style: TextStyle(
                    color: Color(0xFF475569),
                    fontSize: 15.5,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = UserService().currentUser;
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);
    final unread = _service.unreadCount;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Top Curved Blue Header matching UI mockup
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              color: primaryBlue,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(36),
                bottomRight: Radius.circular(36),
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Back button on left
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        onPressed: _handleBack,
                        tooltip: 'กลับ',
                      ),
                    ),

                    // Centered Title and Subtitle
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'การแจ้งเตือน',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          unread > 0
                              ? 'คุณมี $unread ข้อความใหม่'
                              : 'ไม่มีข้อความใหม่',
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 14,
                            fontWeight: FontWeight.w400,
                          ),
                        ),
                      ],
                    ),

                    // Quick action on right (mark all as read / menu)
                    Align(
                      alignment: Alignment.centerRight,
                      child: PopupMenuButton<String>(
                        icon: const Icon(
                          Icons.more_vert_rounded,
                          color: Colors.white,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        onSelected: (value) {
                          if (value == 'read_all') {
                            _service.markAllAsRead();
                          } else if (value == 'clear_all') {
                            _service.clearAll();
                          } else if (value == 'test_team_report') {
                            _service.simulateTestTeamReportNotification();
                          } else if (value == 'test_fcm') {
                            _service.simulateTestNotification(
                              title: 'อัปเดตงานด่วน!',
                              body:
                                  'มีการเพิ่มกะงานใหม่ในพื้นที่ของคุณ กรุณาตรวจสอบ',
                              type: NotificationType.urgent,
                            );
                          } else if (value == 'test_sos') {
                            _service.triggerSOSAlert(
                              location:
                                  'อาคารเฉลิมพระเกียรติ ชั้น 1 (จุดตรวจหลัก)',
                              guardName: user.fullName.isNotEmpty
                                  ? user.fullName
                                  : (user.username.isNotEmpty
                                      ? user.username
                                      : 'เจ้าหน้าที่ รปภ.'),
                              note:
                                  'ทดสอบการส่งสัญญาณเหตุฉุกเฉินระดับสูงสุด (High Priority SOS Alert)',
                            );
                          }
                        },
                        itemBuilder: (context) => [
                          const PopupMenuItem(
                            value: 'read_all',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.done_all_rounded,
                                  size: 20,
                                  color: Color(0xFF2563EB),
                                ),
                                SizedBox(width: 10),
                                Text('อ่านทั้งหมด'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'test_team_report',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.shield_outlined,
                                  size: 20,
                                  color: Color(0xFFD97706),
                                ),
                                SizedBox(width: 10),
                                Text('จำลองรายงานจากทีม (Team Report)'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'test_sos',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.emergency_rounded,
                                  size: 20,
                                  color: Color(0xFFDC2626),
                                ),
                                SizedBox(width: 10),
                                Text('ทดสอบส่งสัญญาณ SOS (High Priority)'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'test_fcm',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.add_alert_rounded,
                                  size: 20,
                                  color: Color(0xFF16A34A),
                                ),
                                SizedBox(width: 10),
                                Text('จำลองแจ้งเตือนทั่วไป (Test)'),
                              ],
                            ),
                          ),
                          const PopupMenuItem(
                            value: 'clear_all',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.delete_outline_rounded,
                                  size: 20,
                                  color: Colors.red,
                                ),
                                SizedBox(width: 10),
                                Text('ล้างการแจ้งเตือนทั้งหมด'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Notifications List
          Expanded(
            child: _buildSystemNotificationsBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemNotificationsBody() {
    const primaryBlue = Color(0xFF2563EB);
    final notifications = _getSortedNotifications();

    if (notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_none_rounded,
              size: 72,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 14),
            Text(
              'ยังไม่มีการแจ้งเตือน',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            TextButton.icon(
              onPressed: () {
                _service.populateSampleNotifications();
                setState(() {});
              },
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('สร้างการแจ้งเตือนตัวอย่าง'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        setState(() {});
      },
      color: primaryBlue,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 8, bottom: 24),
        itemCount: notifications.length,
        itemBuilder: (context, index) {
          final item = notifications[index];
          return _buildNotificationCard(item);
        },
      ),
    );
  }

  Widget _buildNotificationCard(NotificationItem item) {
    final isUrgentOrUnread = !item.isRead || item.isUrgent;

    return Dismissible(
      key: Key(item.id),
      direction: DismissDirection.endToStart,
      background: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          color: const Color(0xFFFEE2E2),
          borderRadius: BorderRadius.circular(18),
        ),
        child: const Icon(
          Icons.delete_outline_rounded,
          color: Color(0xFFDC2626),
          size: 28,
        ),
      ),
      onDismissed: (_) {
        _service.deleteNotification(item.id);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('ลบการแจ้งเตือนเรียบร้อยแล้ว'),
            duration: const Duration(seconds: 2),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.035),
              blurRadius: 10,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            children: [
              // Left border indicator for unread or urgent notifications
              if (!item.isRead || item.isHighPriority)
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  child: Container(
                    width: 4.5,
                    decoration: BoxDecoration(
                      color: item.isTeamReport
                          ? (item.urgency == 'ด่วนมาก'
                              ? const Color(0xFFDC2626)
                              : (item.urgency == 'ปานกลาง'
                                  ? const Color(0xFFF97316)
                                  : const Color(0xFF2563EB)))
                          : (item.isUrgent
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF2563EB)),
                      borderRadius: const BorderRadius.horizontal(
                        right: Radius.circular(3),
                      ),
                    ),
                  ),
                ),

              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () => _showNotificationDetail(item),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Left Avatar / Image / Icon Circle
                        if (item.isTeamReport && item.images.isNotEmpty)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: SizedBox(
                              width: 48,
                              height: 48,
                              child: _buildEvidenceImageThumbnail(
                                item.images.first,
                                size: 48,
                              ),
                            ),
                          )
                        else
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: item.iconBgColor,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              item.icon,
                              color: item.iconColor,
                              size: 24,
                            ),
                          ),
                        const SizedBox(width: 14),

                        // Title, Badges, Reporter Info, Description
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Row with Title and Time
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Text(
                                      item.isTeamReport
                                          ? (item.reportType ?? item.title)
                                          : item.title,
                                      style: TextStyle(
                                        fontSize: 15.5,
                                        fontWeight: item.isRead
                                            ? FontWeight.w600
                                            : FontWeight.bold,
                                        color: const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (item.isTeamReport &&
                                      item.urgency != null &&
                                      item.urgency!.isNotEmpty) ...[
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 7,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: item.urgency == 'ด่วนมาก'
                                            ? const Color(0xFFFEE2E2)
                                            : (item.urgency == 'ปานกลาง'
                                                ? const Color(0xFFFFEDD5)
                                                : const Color(0xFFDBEAFE)),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        item.urgency!,
                                        style: TextStyle(
                                          fontSize: 10.5,
                                          fontWeight: FontWeight.bold,
                                          color: item.urgency == 'ด่วนมาก'
                                              ? const Color(0xFFDC2626)
                                              : (item.urgency == 'ปานกลาง'
                                                  ? const Color(0xFFF97316)
                                                  : const Color(0xFF2563EB)),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                  ],
                                  Text(
                                    item.timeAgo,
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isUrgentOrUnread
                                          ? const Color(0xFFDC2626)
                                          : const Color(0xFF94A3B8),
                                      fontWeight: isUrgentOrUnread
                                          ? FontWeight.w600
                                          : FontWeight.normal,
                                    ),
                                  ),
                                ],
                              ),

                              // Team notification badge row
                              if (item.isTeamReport) ...[
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 6,
                                        vertical: 2,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFEFF6FF),
                                        borderRadius: BorderRadius.circular(6),
                                        border: Border.all(
                                          color: const Color(0xFFBFDBFE),
                                        ),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.shield_outlined,
                                            size: 11,
                                            color: Color(0xFF2563EB),
                                          ),
                                          SizedBox(width: 3),
                                          Text(
                                            'รายงานจากทีม',
                                            style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFF2563EB),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    if (item.guardName != null &&
                                        item.guardName!.isNotEmpty) ...[
                                      const SizedBox(width: 6),
                                      Expanded(
                                        child: Text(
                                          'ผู้รายงาน: ${item.guardName} • ${item.location ?? ""}',
                                          style: const TextStyle(
                                            fontSize: 11.5,
                                            color: Color(0xFF64748B),
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ],

                              const SizedBox(height: 6),

                              // Body Description
                              Text(
                                (item.reportDescription != null &&
                                        item.reportDescription!.isNotEmpty)
                                    ? item.reportDescription!
                                    : item.body,
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  color: Color(0xFF64748B),
                                  height: 1.45,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),

                              // Image count badge if images exist
                              if (item.images.isNotEmpty) ...[
                                const SizedBox(height: 6),
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.photo_camera,
                                      size: 13,
                                      color: Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${item.images.length} รูปภาพแนบ',
                                      style: const TextStyle(
                                        fontSize: 11.5,
                                        color: Color(0xFF64748B),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  bool _isLocalFile(String path) {
    if (path.isEmpty) return false;
    if (path.startsWith('http://') || path.startsWith('https://')) return false;
    try {
      final f = File(path);
      return f.existsSync();
    } catch (_) {
      return false;
    }
  }

  String _formatImageUrl(String raw) {
    if (raw.isEmpty || raw == 'default_report.jpg') return '';
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    // Don't treat a local path that failed _isLocalFile as a server URL
    if (raw.startsWith('/') &&
        (raw.contains('/data/') ||
            raw.contains('/storage/') ||
            raw.contains('/cache/'))) {
      return '';
    }
    if (raw.contains('\\') || raw.contains(':\\')) {
      return '';
    }
    final root = AuthApiService.baseUrl.replaceAll('/api', '');
    if (raw.startsWith('/uploads/')) return '$root$raw';
    if (raw.startsWith('uploads/')) return '$root/$raw';
    if (raw.startsWith('reports/') ||
        raw.startsWith('events/') ||
        raw.startsWith('profiles/')) {
      return '$root/uploads/$raw';
    }
    // If it's a raw filename without directory prefix, default to reports/
    return '$root/uploads/reports/$raw';
  }

  Widget _buildImagePlaceholder() {
    return const Center(
      child: Icon(
        Icons.image_outlined,
        color: Colors.grey,
        size: 28,
      ),
    );
  }

  Widget _buildErrorImageContainer() {
    return Container(
      color: Colors.black87,
      padding: const EdgeInsets.all(32),
      child: const Center(
        child: Text(
          'ไม่สามารถแสดงรูปภาพได้',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildEvidenceImageThumbnail(String path, {double size = 120}) {
    if (_isLocalFile(path)) {
      return Image.file(
        File(path),
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder(),
      );
    }
    final fullUrl = _formatImageUrl(path);
    if (fullUrl.isNotEmpty) {
      return Image.network(
        fullUrl,
        width: size,
        height: size,
        fit: BoxFit.cover,
        loadingBuilder: (context, child, loadingProgress) {
          if (loadingProgress == null) return child;
          return Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                value: loadingProgress.expectedTotalBytes != null
                    ? loadingProgress.cumulativeBytesLoaded /
                        loadingProgress.expectedTotalBytes!
                    : null,
              ),
            ),
          );
        },
        errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder(),
      );
    }
    return _buildImagePlaceholder();
  }

  void _showFullImagePreview(String imagePathOrUrl) {
    final isLocal = _isLocalFile(imagePathOrUrl);
    final fullUrl = isLocal ? '' : _formatImageUrl(imagePathOrUrl);

    if (!isLocal && fullUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('ไม่สามารถระบุตำแหน่งรูปภาพได้'),
          duration: Duration(seconds: 2),
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (dialogCtx) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(12),
        child: Stack(
          alignment: Alignment.topRight,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: InteractiveViewer(
                minScale: 0.5,
                maxScale: 4.0,
                child: isLocal
                    ? Image.file(
                        File(imagePathOrUrl),
                        fit: BoxFit.contain,
                        errorBuilder: (ctx, err, stack) =>
                            _buildErrorImageContainer(),
                      )
                    : Image.network(
                        fullUrl,
                        fit: BoxFit.contain,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return const Center(
                            child: CircularProgressIndicator(
                              color: Colors.white,
                            ),
                          );
                        },
                        errorBuilder: (ctx, err, stack) =>
                            _buildErrorImageContainer(),
                      ),
              ),
            ),
            IconButton(
              onPressed: () => Navigator.pop(dialogCtx),
              icon: const CircleAvatar(
                backgroundColor: Colors.black54,
                child: Icon(Icons.close, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 16, color: const Color(0xFF64748B)),
        const SizedBox(width: 8),
        Text(
          label,
          style: const TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w600,
            color: Color(0xFF64748B),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1E293B),
            ),
          ),
        ),
      ],
    );
  }
}


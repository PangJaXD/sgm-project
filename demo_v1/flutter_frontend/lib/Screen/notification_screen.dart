import 'package:flutter/material.dart';
import '../Model/notification_model.dart';
import '../Service/notification_service.dart';

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
  }

  @override
  void dispose() {
    _service.removeListener(_onServiceUpdate);
    super.dispose();
  }

  void _onServiceUpdate() {
    if (mounted) setState(() {});
  }

  void _handleBack() {
    if (widget.onBack != null) {
      widget.onBack!();
    } else if (Navigator.canPop(context)) {
      Navigator.pop(context);
    }
  }

  void _showNotificationDetail(NotificationItem item) {
    _service.markAsRead(item.id);

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
                          color:
                              (!item.isRead ||
                                  item.type == NotificationType.urgent)
                              ? const Color(0xFFDC2626)
                              : const Color(0xFF94A3B8),
                          fontWeight:
                              (!item.isRead ||
                                  item.type == NotificationType.urgent)
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
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  'ข้อมูลเพิ่มเติม: ${item.data}',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF64748B),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'รับทราบ',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
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
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);
    final unread = _service.unreadCount;
    final notifications = _service.notifications;

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
                          } else if (value == 'test_fcm') {
                            _service.simulateTestNotification(
                              title: 'อัปเดตงานด่วน!',
                              body:
                                  'มีการเพิ่มกะงานใหม่ในพื้นที่ของคุณ กรุณาตรวจสอบ',
                              type: NotificationType.urgent,
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
                            value: 'test_fcm',
                            child: Row(
                              children: [
                                Icon(
                                  Icons.add_alert_rounded,
                                  size: 20,
                                  color: Color(0xFF16A34A),
                                ),
                                SizedBox(width: 10),
                                Text('จำลองแจ้งเตือน (Test)'),
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
            child: notifications.isEmpty
                ? Center(
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
                          onPressed: () => _service.simulateTestNotification(),
                          icon: const Icon(Icons.refresh_rounded, size: 18),
                          label: const Text('สร้างการแจ้งเตือนตัวอย่าง'),
                        ),
                      ],
                    ),
                  )
                : RefreshIndicator(
                    onRefresh: () async {
                      // Trigger state refresh
                      setState(() {});
                    },
                    color: primaryBlue,
                    child: ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.only(top: 14, bottom: 24),
                      itemCount: notifications.length,
                      itemBuilder: (context, index) {
                        final item = notifications[index];
                        return _buildNotificationCard(item);
                      },
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(NotificationItem item) {
    final isUrgentOrUnread =
        !item.isRead || item.type == NotificationType.urgent;

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
              // Left blue accent indicator for unread notifications (matching mockup)
              if (!item.isRead)
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  child: Container(
                    width: 4.5,
                    decoration: const BoxDecoration(
                      color: Color(0xFF2563EB),
                      borderRadius: BorderRadius.horizontal(
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
                        // Left Icon Circle Badge
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

                        // Title, Timestamp, and Body
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
                                      item.title,
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
                              const SizedBox(height: 6),

                              // Body Description
                              Text(
                                item.body,
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  color: Color(0xFF64748B),
                                  height: 1.45,
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
            ],
          ),
        ),
      ),
    );
  }
}

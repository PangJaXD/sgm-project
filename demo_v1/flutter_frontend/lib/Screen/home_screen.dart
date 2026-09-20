import 'package:flutter/material.dart';
import '../Model/assignment_model.dart';
import '../Service/api_exception.dart';
import '../Service/event_service.dart';
import '../Service/notification_service.dart';
import '../Service/user_service.dart';

import './profile_screen.dart';
import './notification_screen.dart';
import './guard_event_detail_screen.dart';
import './shift_detail_screen.dart';
import './assignment_detail_screen.dart';
import './report_situation_screen.dart';
import './working_history_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  final EventService _eventService = EventService();

  int _selectedIndex = 1; // Highlight 'งาน' as shown in the mockup
  String _searchQuery = '';
  bool _isLoading = true;
  String? _errorMessage;
  List<EventModel> _events = [];
  AssignmentModel? _activeAssignment;

  @override
  void initState() {
    super.initState();
    _loadEvents();
    NotificationService.instance.addListener(_onNotificationChange);
  }

  @override
  void dispose() {
    NotificationService.instance.removeListener(_onNotificationChange);
    _searchController.dispose();
    super.dispose();
  }

  void _onNotificationChange() {
    if (mounted) setState(() {});
  }

  Future<void> _loadEvents() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = UserService().currentUser;
      final eventsFuture = _eventService.fetchEvents(
        guardId: user.usersId,
        headName: user.headName,
        company: user.companyName,
      );
      final assignmentFuture = _eventService.fetchActiveAssignment(
        user.usersId,
      );

      final results = await Future.wait([
        eventsFuture.catchError((_) => <EventModel>[]),
        assignmentFuture.catchError((_) => null),
      ]);

      if (mounted) {
        setState(() {
          _events = results[0] as List<EventModel>;
          _activeAssignment = results[1] as AssignmentModel?;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = ApiException.extractMessage(e);
          _isLoading = false;
        });
      }
    }
  }

  EventModel _getEventForAssignment(AssignmentModel assign) {
    final match = _events
        .where(
          (e) =>
              (assign.eventId != null && e.id == assign.eventId) ||
              e.title == assign.eventName,
        )
        .firstOrNull;
    if (match != null) return match;
    return EventModel(
      id: assign.eventId ?? assign.shiftId,
      title: assign.eventName,
      location: assign.dutyLocation,
    );
  }

  ShiftTimeModel _getShiftForAssignment(AssignmentModel assign) {
    return ShiftTimeModel(
      shiftId: assign.shiftId,
      title: assign.shiftName,
      dutyLocation: assign.dutyLocation,
    );
  }

  List<EventModel> get _filteredEvents {
    if (_searchQuery.trim().isEmpty) {
      return _events;
    }
    final query = _searchQuery.toLowerCase();
    return _events.where((event) {
      return event.title.toLowerCase().contains(query) ||
          event.location.toLowerCase().contains(query) ||
          event.contractor.toLowerCase().contains(query) ||
          event.jobType.toLowerCase().contains(query);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);

    Widget body;
    if (_selectedIndex == 3) {
      body = const ProfileScreen();
    } else if (_selectedIndex == 2) {
      body = NotificationScreen(
        isTab: true,
        onBack: () => setState(() => _selectedIndex = 0),
      );
    } else if (_selectedIndex == 0) {
      body = _buildHomeDashboard();
    } else {
      body = Column(
        children: [
          // Header Section with curved bottom
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
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
                child: Column(
                  children: [
                    // Title
                    const Text(
                      'ค้นหางานรักษาความปลอดภัย',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Search Bar
                    Container(
                      height: 48,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.08),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val;
                          });
                        },
                        style: const TextStyle(
                          fontSize: 15,
                          color: Color(0xFF1E293B),
                        ),
                        decoration: InputDecoration(
                          hintText: 'ค้นหาสถานที่...',
                          hintStyle: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 14,
                          ),
                          prefixIcon: const Icon(
                            Icons.search,
                            color: Color(0xFF94A3B8),
                            size: 22,
                          ),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(
                                    Icons.clear,
                                    color: Color(0xFF94A3B8),
                                    size: 18,
                                  ),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() {
                                      _searchQuery = '';
                                    });
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 13,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Body Content (Dynamic Job List from API)
          Expanded(child: _buildBodyContent()),
        ],
      );
    }

    return Scaffold(
      backgroundColor: backgroundColor,
      body: body,
      // Bottom Navigation Bar
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: SizedBox(
            height: 64,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildNavItem(0, Icons.home_rounded, 'หน้าแรก'),
                _buildNavItem(1, Icons.calendar_month_rounded, 'งาน'),
                _buildNavItem(2, Icons.notifications_rounded, 'แจ้งเตือน'),
                _buildNavItem(3, Icons.person_rounded, 'โปรไฟล์'),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHomeDashboard() {
    const primaryBlue = Color(0xFF2563EB);
    final user = UserService().currentUser;

    return RefreshIndicator(
      onRefresh: _loadEvents,
      color: primaryBlue,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          // Top curved banner with Guard greeting
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
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.shield_rounded,
                            color: primaryBlue,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'สวัสดี, ${user.firstName}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 19,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '${user.employeeIdDisplay} • ${user.roleTitle}',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          onPressed: () {
                            setState(() => _selectedIndex = 2);
                          },
                          icon: const Icon(
                            Icons.notifications_none_rounded,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Active Shift Card from Database
                if (_activeAssignment != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0xFFDCFCE7),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.fiber_manual_record,
                                    size: 8,
                                    color: Color(0xFF16A34A),
                                  ),
                                  const SizedBox(width: 5),
                                  Text(
                                    _activeAssignment!.statusDisplay,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFF16A34A),
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Spacer(),
                            Text(
                              _activeAssignment!.shiftTime,
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _activeAssignment!.eventName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            const Icon(
                              Icons.pin_drop,
                              size: 16,
                              color: Color(0xFF64748B),
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                'จุดประจำการ: ${_activeAssignment!.dutyLocation}',
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  color: Color(0xFF64748B),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 18),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  final activeEvent = _getEventForAssignment(
                                    _activeAssignment!,
                                  );
                                  final activeShift = _getShiftForAssignment(
                                    _activeAssignment!,
                                  );
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ShiftDetailScreen(
                                        event: activeEvent,
                                        shift: activeShift,
                                      ),
                                    ),
                                  );
                                },
                                icon: const Icon(
                                  Icons.visibility_rounded,
                                  color: Colors.white,
                                  size: 16,
                                ),
                                label: const Text(
                                  'ดูกะงาน',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryBlue,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  elevation: 0,
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () {
                                  final activeEvent = _getEventForAssignment(
                                    _activeAssignment!,
                                  );
                                  final activeShift = _getShiftForAssignment(
                                    _activeAssignment!,
                                  );
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          AssignmentDetailScreen(
                                            event: activeEvent,
                                            shift: activeShift,
                                          ),
                                    ),
                                  );
                                },
                                icon: const Icon(
                                  Icons.pin_drop_rounded,
                                  color: primaryBlue,
                                  size: 16,
                                ),
                                label: const Text(
                                  'หน้าที่',
                                  style: TextStyle(
                                    color: primaryBlue,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: primaryBlue),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 52,
                          height: 52,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(
                            Icons.event_note_rounded,
                            color: primaryBlue,
                            size: 28,
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'ยังไม่มีกะงานที่เข้าปฏิบัติหน้าที่',
                          style: TextStyle(
                            fontSize: 16.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'เลือกดูงานอีเวนต์และกะงานที่เปิดรับ เพื่อส่งคำร้องเข้าร่วมปฏิบัติหน้าที่',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 13,
                            color: Color(0xFF64748B),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton.icon(
                          onPressed: () => setState(() => _selectedIndex = 1),
                          icon: const Icon(
                            Icons.search_rounded,
                            color: Colors.white,
                            size: 18,
                          ),
                          label: const Text(
                            'ค้นหากะงานใหม่',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: primaryBlue,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 24),

                // Quick Navigation Grid
                const Text(
                  'เมนูด่วน',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 14),

                Row(
                  children: [
                    Expanded(
                      child: _buildDashboardTile(
                        icon: Icons.checklist_rtl_rounded,
                        color: const Color(0xFF2563EB),
                        bgColor: const Color(0xFFDBEAFE),
                        title: 'หน้าที่รับผิดชอบ',
                        onTap: () {
                          if (_activeAssignment != null) {
                            final activeEvent = _getEventForAssignment(
                              _activeAssignment!,
                            );
                            final activeShift = _getShiftForAssignment(
                              _activeAssignment!,
                            );
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => AssignmentDetailScreen(
                                  event: activeEvent,
                                  shift: activeShift,
                                ),
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'คุณยังไม่มีกะงานที่ได้รับมอบหมายในขณะนี้',
                                ),
                              ),
                            );
                          }
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDashboardTile(
                        icon: Icons.shield_outlined,
                        color: const Color(0xFFEA580C),
                        bgColor: const Color(0xFFFFEDD5),
                        title: 'รายงานเหตุการณ์',
                        onTap: () {
                          if (_activeAssignment != null) {
                            final activeEvent = _getEventForAssignment(
                              _activeAssignment!,
                            );
                            final activeShift = _getShiftForAssignment(
                              _activeAssignment!,
                            );
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ReportSituationScreen(
                                  event: activeEvent,
                                  shift: activeShift,
                                ),
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'คุณยังไม่มีกะงานที่เข้าปฏิบัติหน้าที่ กรุณาเลือกกะงานที่ได้รับมอบหมายก่อนส่งรายงาน',
                                ),
                              ),
                            );
                          }
                        },
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildDashboardTile(
                        icon: Icons.history_rounded,
                        color: const Color(0xFF0D9488),
                        bgColor: const Color(0xFFCCFBF1),
                        title: 'ประวัติการทำงาน',
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  const WorkingHistoryScreen(),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildDashboardTile(
                        icon: Icons.search_rounded,
                        color: const Color(0xFF7C3AED),
                        bgColor: const Color(0xFFEDE9FE),
                        title: 'ค้นหากะงานใหม่',
                        onTap: () => setState(() => _selectedIndex = 1),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Available Events Preview Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'งานอีเวนต์ที่เปิดรับ',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _selectedIndex = 1),
                      child: const Text('ดูทั้งหมด'),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                if (_events.isNotEmpty)
                  ..._events.take(2).map((e) => _buildEventCard(e)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboardTile({
    required IconData icon,
    required Color color,
    required Color bgColor,
    required String title,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: bgColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    title,
                    style: const TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1E293B),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBodyContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF2563EB)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.cloud_off_rounded,
                size: 64,
                color: Colors.red.shade300,
              ),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 15, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadEvents,
                icon: const Icon(Icons.refresh, color: Colors.white),
                label: const Text(
                  'ลองใหม่อีกครั้ง',
                  style: TextStyle(color: Colors.white),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_filteredEvents.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadEvents,
        color: const Color(0xFF2563EB),
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(
              height: MediaQuery.of(context).size.height * 0.45,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.search_off_rounded,
                      size: 64,
                      color: Colors.grey.shade400,
                    ),
                    const SizedBox(height: 12),
                    Text(
                      _searchQuery.isNotEmpty
                          ? 'ไม่พบงานที่ตรงกับการค้นหา "$_searchQuery"'
                          : 'ยังไม่มีรายการงานในระบบ',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadEvents,
      color: const Color(0xFF2563EB),
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        itemCount: _filteredEvents.length,
        itemBuilder: (context, index) {
          final event = _filteredEvents[index];
          return _buildEventCard(event);
        },
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedIndex == index;
    final color = isSelected
        ? const Color(0xFF2563EB)
        : const Color(0xFF94A3B8);

    Widget iconWidget = Icon(icon, color: color, size: 24);
    if (index == 2) {
      final unread = NotificationService.instance.unreadCount;
      if (unread > 0) {
        iconWidget = Badge(
          label: Text(
            unread > 99 ? '99+' : '$unread',
            style: const TextStyle(
              fontSize: 10,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          backgroundColor: const Color(0xFFEF4444),
          child: iconWidget,
        );
      }
    }

    return InkWell(
      onTap: () {
        setState(() {
          _selectedIndex = index;
        });
      },
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            iconWidget,
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEventCard(EventModel event) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Stack(
          children: [
            // Left decorative accent border line
            Positioned(
              left: 0,
              top: 14,
              bottom: 14,
              child: Container(
                width: 4.5,
                decoration: BoxDecoration(
                  color: event.accentColor,
                  borderRadius: const BorderRadius.horizontal(
                    right: Radius.circular(4),
                  ),
                ),
              ),
            ),

            // Card content
            Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          GuardEventDetailScreen(event: event),
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Category Tag
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: event.tagBgColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          event.jobType,
                          style: TextStyle(
                            color: event.tagTextColor,
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Event Title
                      Text(
                        event.title,
                        style: const TextStyle(
                          fontSize: 17.5,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Location
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on,
                            size: 18,
                            color: Color(0xFF64748B),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              event.location,
                              style: const TextStyle(
                                fontSize: 13.5,
                                color: Color(0xFF64748B),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 18),

                      // Action Button
                      SizedBox(
                        width: double.infinity,
                        height: 46,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    GuardEventDetailScreen(event: event),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'ดูรายละเอียด',
                            style: TextStyle(
                              color: Colors.white,
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
            ),
          ],
        ),
      ),
    );
  }
}

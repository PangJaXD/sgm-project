import 'package:flutter/material.dart';
import '../Service/event_service.dart';
import '../Service/user_service.dart';
import './send_request_screen.dart';
import './shift_detail_screen.dart';

class EventShiftListScreen extends StatefulWidget {
  final EventModel event;

  const EventShiftListScreen({super.key, required this.event});

  @override
  State<EventShiftListScreen> createState() => _EventShiftListScreenState();
}

class _EventShiftListScreenState extends State<EventShiftListScreen> {
  final EventService _eventService = EventService.instance;
  bool _isLoading = true;
  List<ShiftTimeModel> _shifts = [];

  @override
  void initState() {
    super.initState();
    _loadShifts();
  }

  Future<void> _loadShifts() async {
    setState(() => _isLoading = true);
    try {
      final user = UserService().currentUser;
      final shifts = await _eventService.fetchEventShifts(
        widget.event.id,
        guardId: user.usersId,
        headName: user.headName,
      );
      if (mounted) {
        setState(() {
          _shifts = shifts.isNotEmpty ? shifts : widget.event.shiftTimes;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _shifts = widget.event.shiftTimes;
          _isLoading = false;
        });
      }
    }
  }

  Map<String, List<ShiftTimeModel>> get _groupedShifts {
    final Map<String, List<ShiftTimeModel>> groups = {};
    for (var shift in _shifts) {
      final key = shift.formattedDateThai;
      groups.putIfAbsent(key, () => []).add(shift);
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Header Section matching Figure 3.106
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
                    Align(
                      alignment: Alignment.centerLeft,
                      child: IconButton(
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Colors.white,
                          size: 22,
                        ),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'กะงานที่เปิดรับ',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.event.title,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // List of shifts grouped by date
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: primaryBlue),
                  )
                : _shifts.isEmpty
                ? Center(
                    child: Text(
                      'ไม่มีกะงานที่เปิดรับในขณะนี้',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 16,
                    ),
                    children: _groupedShifts.entries.map((entry) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 4,
                              vertical: 10,
                            ),
                            child: Text(
                              entry.key,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF1E293B),
                              ),
                            ),
                          ),
                          ...entry.value.map((shift) => _buildShiftCard(shift)),
                        ],
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildShiftCard(ShiftTimeModel shift) {
    const primaryBlue = Color(0xFF2563EB);
    final isRequested = _eventService.requestedShiftIds.contains(shift.shiftId);
    final isFull = shift.isFull && !isRequested;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
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
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title and Quota Tag
            Row(
              children: [
                Expanded(
                  child: Text(
                    shift.title,
                    style: const TextStyle(
                      fontSize: 16.5,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 5,
                  ),
                  decoration: BoxDecoration(
                    color: isRequested
                        ? const Color(0xFFDBEAFE)
                        : isFull
                        ? const Color(0xFFFEE2E2)
                        : const Color(0xFFDCFCE7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isRequested
                        ? 'สมัครแล้ว'
                        : isFull
                        ? 'เต็มแล้ว'
                        : 'ว่าง ${shift.availableSlots} อัตรา',
                    style: TextStyle(
                      color: isRequested
                          ? const Color(0xFF1D4ED8)
                          : isFull
                          ? const Color(0xFFDC2626)
                          : const Color(0xFF16A34A),
                      fontSize: 12.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Time row
            Row(
              children: [
                const Icon(
                  Icons.access_time_rounded,
                  size: 17,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 8),
                Text(
                  shift.formattedTime,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF475569),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // Location row
            Row(
              children: [
                const Icon(
                  Icons.pin_drop_rounded,
                  size: 17,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'จุดประจำการ: ${shift.dutyLocation}',
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF475569),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),

            // Action Button
            SizedBox(
              width: double.infinity,
              height: 46,
              child: isRequested
                  ? OutlinedButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ShiftDetailScreen(
                              event: widget.event,
                              shift: shift,
                            ),
                          ),
                        );
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: primaryBlue, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'ดูรายละเอียดกะงาน (View Event Shift)',
                        style: TextStyle(
                          color: primaryBlue,
                          fontSize: 14.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  : isFull
                  ? ElevatedButton(
                      onPressed: null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE2E8F0),
                        disabledBackgroundColor: const Color(0xFFF1F5F9),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        elevation: 0,
                      ),
                      child: const Text(
                        'ไม่สามารถสมัครได้',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 14.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                  : OutlinedButton(
                      onPressed: () async {
                        if (UserService().isNotStartedYet) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                'ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถสมัครกะงานได้',
                              ),
                              backgroundColor: Color(0xFFEF4444),
                            ),
                          );
                          return;
                        }
                        final requested = await Navigator.push<bool>(
                          context,
                          MaterialPageRoute(
                            builder: (context) => SendRequestScreen(
                              event: widget.event,
                              shift: shift,
                            ),
                          ),
                        );
                        if (requested == true && mounted) {
                          setState(() {});
                        }
                      },
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: primaryBlue, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text(
                        'สมัครกะนี้',
                        style: TextStyle(
                          color: primaryBlue,
                          fontSize: 14.5,
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
}

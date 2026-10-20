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
  bool _hasChanged = false;
  List<ShiftTimeModel> _shifts = [];
  final Set<int> _selectedShiftIds = {};

  @override
  void initState() {
    super.initState();
    _loadShifts();
  }

  bool _isShiftRequested(ShiftTimeModel shift) =>
      _eventService.requestedShiftIds.contains(shift.shiftId) ||
      shift.isApplied;

  bool _isShiftAvailable(ShiftTimeModel shift) =>
      !_isShiftRequested(shift) && !shift.isFull;

  List<ShiftTimeModel> get _availableShifts =>
      _shifts.where(_isShiftAvailable).toList();

  bool get _isAllSelected =>
      _availableShifts.isNotEmpty &&
      _availableShifts.every((s) => _selectedShiftIds.contains(s.shiftId));

  void _toggleSelectAll(bool? value) {
    setState(() {
      if (_isAllSelected) {
        _selectedShiftIds.clear();
      } else {
        _selectedShiftIds
          ..clear()
          ..addAll(_availableShifts.map((s) => s.shiftId));
      }
    });
  }

  void _toggleShiftSelection(int shiftId) {
    setState(() {
      if (_selectedShiftIds.contains(shiftId)) {
        _selectedShiftIds.remove(shiftId);
      } else {
        _selectedShiftIds.add(shiftId);
      }
    });
  }

  Future<void> _navigateToApplyShifts(
    List<ShiftTimeModel> shiftsToApply,
  ) async {
    if (shiftsToApply.isEmpty) return;
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
          shift: shiftsToApply.first,
          initialSelectedShifts: shiftsToApply,
          availableShifts: _availableShifts,
        ),
      ),
    );
    if (requested == true) {
      _hasChanged = true;
      _selectedShiftIds.clear();
    }
    if (mounted) {
      _loadShifts();
    }
  }

  Future<void> _loadShifts() async {
    setState(() => _isLoading = true);
    try {
      final user = UserService().currentUser;
      if (user.usersId > 0 && user.isGuard) {
        await _eventService.syncGuardAppliedShifts(user.usersId);
      }
      final shifts = await _eventService.fetchEventShifts(
        widget.event.id,
        guardId: user.usersId,
        headName: user.headName,
      );
      if (mounted) {
        setState(() {
          _shifts = _sortShiftsDesc(
            shifts.isNotEmpty ? shifts : widget.event.shiftTimes,
          );
          final availableIds =
              _shifts.where(_isShiftAvailable).map((s) => s.shiftId).toSet();
          _selectedShiftIds.removeWhere((id) => !availableIds.contains(id));
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _shifts = _sortShiftsDesc(widget.event.shiftTimes);
          final availableIds =
              _shifts.where(_isShiftAvailable).map((s) => s.shiftId).toSet();
          _selectedShiftIds.removeWhere((id) => !availableIds.contains(id));
          _isLoading = false;
        });
      }
    }
  }

  List<ShiftTimeModel> _sortShiftsDesc(List<ShiftTimeModel> list) {
    final sorted = List<ShiftTimeModel>.from(list);
    sorted.sort((a, b) {
      final dtA = _getEffectiveDateTime(a);
      final dtB = _getEffectiveDateTime(b);

      if (dtA != null && dtB != null) {
        final cmp = dtB.compareTo(dtA);
        if (cmp != 0) return cmp;
      } else if (dtA == null && dtB != null) {
        return 1;
      } else if (dtA != null && dtB == null) {
        return -1;
      }

      return b.shiftId.compareTo(a.shiftId);
    });
    return sorted;
  }

  DateTime? _getEffectiveDateTime(ShiftTimeModel shift) {
    final dt = shift.effectiveDateTime;
    if (dt != null) return dt;
    final fallback = widget.event.startDate;
    if (fallback != null) {
      final ceYear = fallback.year > 2400 ? fallback.year - 543 : fallback.year;
      return DateTime(ceYear, fallback.month, fallback.day);
    }
    return null;
  }

  String _getMonthGroupKey(ShiftTimeModel shift) {
    if (shift.shiftDate == null &&
        shift.startTime == null &&
        widget.event.startDate != null) {
      final d = widget.event.startDate!;
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
      return '${months[d.month]} $thaiYear';
    }
    return shift.monthGroupThai;
  }

  Map<String, List<ShiftTimeModel>> get _groupedShifts {
    final Map<String, List<ShiftTimeModel>> groups = {};
    final sortedShifts = _sortShiftsDesc(_shifts);
    for (var shift in sortedShifts) {
      final key = _getMonthGroupKey(shift);
      groups.putIfAbsent(key, () => []).add(shift);
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          Navigator.pop(context, _hasChanged);
        }
      },
      child: Scaffold(
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
                          onPressed: () => Navigator.pop(context, _hasChanged),
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
                  ? RefreshIndicator(
                      onRefresh: _loadShifts,
                      color: primaryBlue,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(
                            height: MediaQuery.of(context).size.height * 0.4,
                            child: Center(
                              child: Text(
                                'ไม่มีกะงานที่เปิดรับในขณะนี้',
                                style: TextStyle(
                                  fontSize: 16,
                                  color: Colors.grey.shade600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadShifts,
                      color: primaryBlue,
                      child: ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 16,
                        ),
                        children: [
                          if (_availableShifts.isNotEmpty)
                            _buildSelectAllBanner(),
                          ..._groupedShifts.entries.map((entry) {
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
                                ...entry.value.map(
                                  (shift) => _buildShiftCard(shift),
                                ),
                              ],
                            );
                          }),
                        ],
                      ),
                    ),
            ),

            // Bottom Action Bar when 1 or more shifts are selected
            if (!_isLoading && _selectedShiftIds.isNotEmpty)
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: SafeArea(
                  top: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 14, 20, 16),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'เลือกแล้ว ${_selectedShiftIds.length} กะงาน',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _isAllSelected
                                    ? 'เลือกครบทุกกะงานที่ว่างแล้ว'
                                    : 'จากทั้งหมด ${_availableShifts.length} กะงานที่ว่าง',
                                style: const TextStyle(
                                  fontSize: 12.5,
                                  color: Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          height: 48,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              final selected = _availableShifts
                                  .where(
                                    (s) =>
                                        _selectedShiftIds.contains(s.shiftId),
                                  )
                                  .toList();
                              _navigateToApplyShifts(selected);
                            },
                            icon: const Icon(
                              Icons.check_circle_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                            label: Text(
                              _isAllSelected && _availableShifts.length > 1
                                  ? 'สมัครทั้งหมด (${_selectedShiftIds.length} กะ)'
                                  : 'สมัครที่เลือก (${_selectedShiftIds.length} กะ)',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14.5,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: primaryBlue,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 18,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              elevation: 0,
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

  Widget _buildSelectAllBanner() {
    const primaryBlue = Color(0xFF2563EB);
    final availableCount = _availableShifts.length;
    final selectedCount = _selectedShiftIds.length;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: _isAllSelected ? const Color(0xFFEFF6FF) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: _isAllSelected ? primaryBlue : const Color(0xFFCBD5E1),
          width: _isAllSelected ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _toggleSelectAll(!_isAllSelected),
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: _isAllSelected,
                    activeColor: primaryBlue,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(6),
                    ),
                    onChanged: _toggleSelectAll,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'เลือกสมัครกะงานทั้งหมด ($availableCount กะ)',
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        selectedCount > 0
                            ? 'เลือกแล้ว $selectedCount จาก $availableCount กะงานที่ว่าง'
                            : 'ติ๊กเพื่อเลือกสมัครทุกกะงานที่ว่างในครั้งเดียว',
                        style: const TextStyle(
                          fontSize: 12.5,
                          color: Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                if (selectedCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: primaryBlue,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$selectedCount/$availableCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
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

  Widget _buildShiftCard(ShiftTimeModel shift) {
    const primaryBlue = Color(0xFF2563EB);
    final isRequested = _isShiftRequested(shift);
    final isFull = shift.isFull && !isRequested;
    final isAvailable = !isRequested && !isFull;
    final isSelected = isAvailable && _selectedShiftIds.contains(shift.shiftId);

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFFF8FAFC) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isSelected ? primaryBlue : Colors.transparent,
          width: 1.5,
        ),
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
            // Date row, Checkbox (if available), and Quota Tag
            Row(
              children: [
                if (isAvailable) ...[
                  SizedBox(
                    width: 24,
                    height: 24,
                    child: Checkbox(
                      value: isSelected,
                      activeColor: primaryBlue,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                      onChanged: (_) => _toggleShiftSelection(shift.shiftId),
                    ),
                  ),
                  const SizedBox(width: 8),
                ],
                const Icon(
                  Icons.calendar_today_rounded,
                  size: 16,
                  color: Color(0xFF64748B),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: GestureDetector(
                    onTap: isAvailable
                        ? () => _toggleShiftSelection(shift.shiftId)
                        : null,
                    child: Text(
                      shift.formattedDateThai,
                      style: const TextStyle(
                        fontSize: 15,
                        color: Color(0xFF0F172A),
                        fontWeight: FontWeight.bold,
                      ),
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
            const SizedBox(height: 8),

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
                      onPressed: () async {
                        final res = await Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => ShiftDetailScreen(
                              event: widget.event,
                              shift: shift,
                            ),
                          ),
                        );
                        if (res == true) {
                          _hasChanged = true;
                        }
                        if (mounted) {
                          _loadShifts();
                        }
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
                      onPressed: () => _navigateToApplyShifts([shift]),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: isSelected
                            ? const Color(0xFFEFF6FF)
                            : Colors.transparent,
                        side: const BorderSide(color: primaryBlue, width: 1.5),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: Text(
                        isSelected ? 'เลือกไว้แล้ว • สมัครกะนี้ทันที' : 'สมัครกะนี้',
                        style: const TextStyle(
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

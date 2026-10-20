import 'package:flutter/material.dart';
import '../Model/notification_model.dart';
import '../Service/api_exception.dart';
import '../Service/event_service.dart';

import '../Service/notification_service.dart';
import '../Service/user_service.dart';
import './shift_detail_screen.dart';

class SendRequestScreen extends StatefulWidget {
  final EventModel event;
  final ShiftTimeModel shift;
  final List<ShiftTimeModel>? initialSelectedShifts;
  final List<ShiftTimeModel>? availableShifts;

  const SendRequestScreen({
    super.key,
    required this.event,
    required this.shift,
    this.initialSelectedShifts,
    this.availableShifts,
  });

  @override
  State<SendRequestScreen> createState() => _SendRequestScreenState();
}

class _SendRequestScreenState extends State<SendRequestScreen> {
  final EventService _eventService = EventService.instance;
  final UserService _userService = UserService();
  bool _isSubmitting = false;

  late List<ShiftTimeModel> _availableShifts;
  late Set<int> _selectedShiftIds;

  @override
  void initState() {
    super.initState();
    final providedAvailable = widget.availableShifts;
    if (providedAvailable != null && providedAvailable.isNotEmpty) {
      _availableShifts = List<ShiftTimeModel>.from(providedAvailable);
    } else {
      final fromEvent = widget.event.shiftTimes.where((s) {
        final isReq =
            _eventService.requestedShiftIds.contains(s.shiftId) || s.isApplied;
        return !isReq && !s.isFull;
      }).toList();
      if (fromEvent.isNotEmpty) {
        _availableShifts = fromEvent;
      } else {
        _availableShifts = [widget.shift];
      }
    }

    if (!_availableShifts.any((s) => s.shiftId == widget.shift.shiftId)) {
      _availableShifts.insert(0, widget.shift);
    }

    final initial = widget.initialSelectedShifts;
    if (initial != null && initial.isNotEmpty) {
      _selectedShiftIds = initial.map((s) => s.shiftId).toSet();
    } else {
      _selectedShiftIds = {widget.shift.shiftId};
    }
  }

  List<ShiftTimeModel> get _selectedShifts => _availableShifts
      .where((s) => _selectedShiftIds.contains(s.shiftId))
      .toList();

  bool get _isAllSelected =>
      _availableShifts.isNotEmpty &&
      _availableShifts.every((s) => _selectedShiftIds.contains(s.shiftId));

  void _toggleSelectAll(bool? value) {
    setState(() {
      if (_isAllSelected) {
        _selectedShiftIds = {widget.shift.shiftId};
      } else {
        _selectedShiftIds = _availableShifts.map((s) => s.shiftId).toSet();
      }
    });
  }

  void _toggleSingleShift(int shiftId) {
    setState(() {
      if (_selectedShiftIds.contains(shiftId)) {
        if (_selectedShiftIds.length > 1) {
          _selectedShiftIds.remove(shiftId);
        }
      } else {
        _selectedShiftIds.add(shiftId);
      }
    });
  }

  Future<void> _handleSubmitRequest() async {
    final shiftsToSubmit = _selectedShifts;
    if (shiftsToSubmit.isEmpty) return;

    setState(() => _isSubmitting = true);
    final user = _userService.currentUser;

    try {
      int successCount = 0;
      for (final s in shiftsToSubmit) {
        final ok = await _eventService.sendShiftRequest(
          s.shiftId,
          user.usersId,
        );
        if (ok) successCount++;
      }

      if (successCount > 0 && mounted) {
        final isMulti = shiftsToSubmit.length > 1;
        final firstShift =
            shiftsToSubmit.where((s) => s.isWithinShift()).firstOrNull ??
            shiftsToSubmit.first;

        // Add realistic approval / acknowledgement notification
        NotificationService.instance.addNotification(
          NotificationItem(
            id: 'req-${DateTime.now().millisecondsSinceEpoch}',
            title: 'อนุมัติคำร้องรับกะงาน',
            body: isMulti
                ? 'คำร้องเข้าทำงาน ${widget.event.title} จำนวน $successCount กะงาน ของคุณได้รับการอนุมัติเรียบร้อยแล้ว'
                : 'คำร้องเข้าทำงาน ${widget.event.title} (${firstShift.formattedTime}) ของคุณได้รับการอนุมัติเรียบร้อยแล้ว',
            timestamp: DateTime.now(),
            type: NotificationType.approval,
            isRead: false,
          ),
        );

        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_outline_rounded,
                    color: Color(0xFF16A34A),
                    size: 40,
                  ),
                ),
                const SizedBox(height: 18),
                Text(
                  isMulti
                      ? 'ส่งคำขอเข้าทำงาน $successCount กะสำเร็จ!'
                      : 'ส่งคำขอเข้าทำงานสำเร็จ!',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'หัวหน้าชุดรักษาความปลอดภัยได้รับคำขอแล้ว คุณสามารถตรวจสอบสถานะและหน้าที่ได้ในระบบ',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13.5,
                    color: Colors.grey.shade600,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () async {
                      Navigator.pop(context); // close dialog
                      await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ShiftDetailScreen(
                            event: widget.event,
                            shift: firstShift,
                          ),
                        ),
                      );
                      if (context.mounted) {
                        Navigator.pop(context, true);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'ไปที่รายละเอียดกะงาน',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 44,
                  child: OutlinedButton(
                    onPressed: () {
                      Navigator.pop(context); // close dialog
                      Navigator.pop(context, true); // return to shift list with true
                    },
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Color(0xFF2563EB)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      'กลับสู่รายการกะงาน',
                      style: TextStyle(
                        color: Color(0xFF2563EB),
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
    } catch (e) {
      if (mounted) {
        ApiException.showSnackBar(context, e);
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Top Curved Blue Header
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
                        onPressed: () => Navigator.pop(context, false),
                      ),
                    ),
                    const Text(
                      'ยืนยันการรับงาน',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 21,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Content matching Figure 3.112
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(22),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 14,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'รายละเอียดกะงาน',
                          style: TextStyle(
                            fontSize: 17.5,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 18),
                        _buildRow(
                          'สถานที่',
                          widget.event.location.isNotEmpty
                              ? widget.event.location
                              : 'ไม่ระบุสถานที่',
                        ),
                        if (_availableShifts.length > 1) ...[
                          const SizedBox(height: 18),
                          // Checkbox to apply for all available shifts at once
                          InkWell(
                            onTap: () => _toggleSelectAll(!_isAllSelected),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 10,
                              ),
                              decoration: BoxDecoration(
                                color: _isAllSelected
                                    ? const Color(0xFFEFF6FF)
                                    : const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: _isAllSelected
                                      ? primaryBlue
                                      : const Color(0xFFCBD5E1),
                                  width: 1.5,
                                ),
                              ),
                              child: Row(
                                children: [
                                  SizedBox(
                                    width: 24,
                                    height: 24,
                                    child: Checkbox(
                                      value: _isAllSelected,
                                      activeColor: primaryBlue,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(5),
                                      ),
                                      onChanged: _toggleSelectAll,
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'สมัครกะงานที่ว่างทั้งหมด (${_availableShifts.length} กะ)',
                                          style: const TextStyle(
                                            fontSize: 14.5,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1E293B),
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        const Text(
                                          'เลือกเพื่อสมัครทุกกะงานที่เปิดรับในครั้งเดียว',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'กะงานที่เลือกสมัคร (${_selectedShifts.length}/${_availableShifts.length} กะ)',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF334155),
                            ),
                          ),
                          const SizedBox(height: 10),
                          ..._availableShifts.map((s) {
                            final isChecked =
                                _selectedShiftIds.contains(s.shiftId);
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: InkWell(
                                onTap: () => _toggleSingleShift(s.shiftId),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: isChecked
                                        ? const Color(0xFFF8FAFC)
                                        : Colors.white,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isChecked
                                          ? primaryBlue.withValues(alpha: 0.5)
                                          : const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: Checkbox(
                                          value: isChecked,
                                          activeColor: primaryBlue,
                                          shape: RoundedRectangleBorder(
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          onChanged: (_) =>
                                              _toggleSingleShift(s.shiftId),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              s.formattedDateThai,
                                              style: const TextStyle(
                                                fontSize: 13.5,
                                                fontWeight: FontWeight.bold,
                                                color: Color(0xFF0F172A),
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              'เวลา: ${s.formattedTime} • จุดประจำการ: ${s.dutyLocation}',
                                              style: const TextStyle(
                                                fontSize: 12.5,
                                                color: Color(0xFF475569),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          }),
                        ] else ...[
                          const SizedBox(height: 14),
                          _buildRow('วันที่', widget.shift.formattedDateThai),
                          const SizedBox(height: 14),
                          _buildRow('เวลางาน', widget.shift.formattedTime),
                          const SizedBox(height: 14),
                          _buildRow('จุดประจำการ', widget.shift.dutyLocation),
                        ],
                        const SizedBox(height: 24),

                        // Important warning notice box
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFBFDBFE)),
                          ),
                          child: const Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.info_outline_rounded,
                                color: Color(0xFF2563EB),
                                size: 22,
                              ),
                              SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  'กรุณาตรวจสอบเวลาและสถานที่ให้แน่ใจก่อนกดยืนยัน หากรับงานแล้วไม่มาปฏิบัติหน้าที่จะมีผลต่อประวัติการทำงาน',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF1E40AF),
                                    height: 1.55,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 36),

                  // Send Request Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: _isSubmitting ? null : _handleSubmitRequest,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(
                              Icons.check_circle_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                      label: Text(
                        _selectedShifts.length > 1
                            ? 'ส่งคำขอเข้าทำงาน (${_selectedShifts.length} กะ)'
                            : 'ส่งคำขอเข้าทำงาน',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryBlue,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                        elevation: 0,
                      ),
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Cancel text button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text(
                        'ยกเลิก',
                        style: TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 15.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
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

  Widget _buildRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 14.5,
              color: Color(0xFF64748B),
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 15,
              color: Color(0xFF0F172A),
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}

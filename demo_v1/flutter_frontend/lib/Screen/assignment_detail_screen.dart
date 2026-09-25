import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../Model/assignment_model.dart';
import '../Service/event_service.dart';
import '../Service/user_service.dart';
import './report_situation_screen.dart';

class AssignmentDetailScreen extends StatefulWidget {
  final EventModel event;
  final ShiftTimeModel shift;
  final AssignmentModel? assignment;

  const AssignmentDetailScreen({
    super.key,
    required this.event,
    required this.shift,
    this.assignment,
  });

  @override
  State<AssignmentDetailScreen> createState() => _AssignmentDetailScreenState();
}

class _AssignmentDetailScreenState extends State<AssignmentDetailScreen> {
  final EventService _eventService = EventService.instance;
  final UserService _userService = UserService();

  bool _isLoading = true;
  late AssignmentModel _assignment;

  @override
  void initState() {
    super.initState();
    if (widget.assignment != null) {
      _assignment = widget.assignment!;
      _isLoading = false;
    }
    _loadAssignment();
  }

  Future<void> _loadAssignment() async {
    if (widget.assignment == null) {
      setState(() => _isLoading = true);
    }
    final user = _userService.currentUser;
    try {
      final assign = await _eventService.fetchGuardAssignment(
        user.usersId,
        shiftId: widget.shift.shiftId,
      );
      if (mounted) {
        setState(() {
          _assignment = assign;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        final eventLat = double.tryParse(widget.event.latitude ?? '') ?? 0.0;
        final eventLng = double.tryParse(widget.event.longitude ?? '') ?? 0.0;

        setState(() {
          _assignment =
              widget.assignment ??
              AssignmentModel(
                assignmentId: 0,
                guardId: user.usersId,
                shiftId: widget.shift.shiftId,
                eventId: widget.event.id,
                assignmentStatus: widget.shift.status.isNotEmpty
                    ? widget.shift.status
                    : 'ASSIGNED',
                description: widget.event.description.isNotEmpty
                    ? widget.event.description
                    : 'ปฏิบัติหน้าที่รักษาความปลอดภัย ณ ${widget.shift.dutyLocation}',
                eventName: widget.event.title,
                dutyLocation: widget.shift.dutyLocation.isNotEmpty
                    ? widget.shift.dutyLocation
                    : widget.event.location,
                shiftName: widget.shift.title,
                shiftTime: widget.shift.formattedTime,
                latitude: eventLat,
                longitude: eventLng,
                requiredTools: widget.event.requiredTools,
                providedTools: widget.event.providedTools,
                supervisorName: user.headName,
                supervisorNote: widget.event.contractor.isNotEmpty
                    ? 'ผู้ประสานงาน: ${widget.event.contractor} (${widget.event.contact})'
                    : 'สังเกตบุคคลและสิ่งผิดปกติเป็นพิเศษ และบันทึกรายงานสถานการณ์อย่างสม่ำเสมอ',
              );
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);

    final effectiveDutyLocation = _assignment.dutyLocation.isNotEmpty
        ? _assignment.dutyLocation
        : (widget.shift.dutyLocation.isNotEmpty
              ? widget.shift.dutyLocation
              : (widget.event.location.isNotEmpty
                    ? widget.event.location
                    : 'จุดตรวจหลัก'));

    final effectiveEventTitle = _assignment.eventName.isNotEmpty
        ? _assignment.eventName
        : (widget.event.title.isNotEmpty
              ? widget.event.title
              : 'งานรักษาความปลอดภัย');

    final effectiveShiftTime = _assignment.shiftTime.isNotEmpty
        ? _assignment.shiftTime
        : widget.shift.formattedTime;

    final effectiveShiftTitle = _assignment.shiftName.isNotEmpty
        ? _assignment.shiftName
        : (widget.shift.title.isNotEmpty
              ? widget.shift.title
              : 'หน้าที่รักษาความปลอดภัย');

    // Determine coordinates dynamically
    LatLng? effectiveLatLng;
    if (_assignment.hasValidCoordinates) {
      effectiveLatLng = LatLng(_assignment.latitude, _assignment.longitude);
    } else if (widget.event.latitude != null &&
        widget.event.longitude != null) {
      final lat = double.tryParse(widget.event.latitude!);
      final lng = double.tryParse(widget.event.longitude!);
      if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
        effectiveLatLng = LatLng(lat, lng);
      }
    }

    final effectiveRequiredTools = _assignment.requiredTools.isNotEmpty
        ? _assignment.requiredTools
        : widget.event.requiredTools;

    final effectiveProvidedTools = _assignment.providedTools.isNotEmpty
        ? _assignment.providedTools
        : widget.event.providedTools;

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Top Curved Header
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
                          'หน้าที่รับผิดชอบ',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          effectiveShiftTime.isNotEmpty
                              ? effectiveShiftTime
                              : effectiveEventTitle,
                          style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.9),
                            fontSize: 13.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Body Content
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: primaryBlue),
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Duty Station & Map Card
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Top status and location row
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 38,
                                    height: 38,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFEFF6FF),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.pin_drop_rounded,
                                      color: Color(0xFF2563EB),
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'จุดประจำการ: $effectiveDutyLocation',
                                          style: const TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFF1E293B),
                                            height: 1.3,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          effectiveEventTitle,
                                          style: const TextStyle(
                                            fontSize: 12.5,
                                            color: Color(0xFF64748B),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Status Badge
                                  _buildStatusBadge(
                                    _assignment.assignmentStatus,
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              // Map Widget or Clean Placeholder
                              if (effectiveLatLng != null) ...[
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(16),
                                  child: Container(
                                    height: 180,
                                    width: double.infinity,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFE2E8F0),
                                      borderRadius: BorderRadius.circular(16),
                                    ),
                                    child: FlutterMap(
                                      options: MapOptions(
                                        initialCenter: effectiveLatLng,
                                        initialZoom: 15.5,
                                        interactionOptions:
                                            const InteractionOptions(
                                              flags:
                                                  InteractiveFlag.pinchZoom |
                                                  InteractiveFlag.drag,
                                            ),
                                      ),
                                      children: [
                                        TileLayer(
                                          urlTemplate:
                                              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                                          userAgentPackageName:
                                              'com.example.flutter_frontend',
                                        ),
                                        MarkerLayer(
                                          markers: [
                                            Marker(
                                              point: effectiveLatLng,
                                              width: 44,
                                              height: 44,
                                              child: const Icon(
                                                Icons.location_on,
                                                color: Color(0xFFEF4444),
                                                size: 40,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.end,
                                  children: [
                                    const Icon(
                                      Icons.my_location_rounded,
                                      size: 13,
                                      color: Color(0xFF94A3B8),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'พิกัด: ${effectiveLatLng.latitude.toStringAsFixed(4)}, ${effectiveLatLng.longitude.toStringAsFixed(4)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF94A3B8),
                                      ),
                                    ),
                                  ],
                                ),
                              ] else ...[
                                Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 24,
                                    horizontal: 16,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(
                                        Icons.map_outlined,
                                        size: 32,
                                        color: Color(0xFF94A3B8),
                                      ),
                                      const SizedBox(height: 8),
                                      const Text(
                                        'ไม่มีข้อมูลพิกัดแผนที่เฉพาะจุด',
                                        style: TextStyle(
                                          fontSize: 13.5,
                                          fontWeight: FontWeight.w600,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'กรุณาปฏิบัติหน้าที่ ณ จุด: $effectiveDutyLocation',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          color: Color(0xFF94A3B8),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // Checklist Section
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(22),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 10,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Row(
                                children: [
                                  Icon(
                                    Icons.format_list_bulleted_rounded,
                                    color: Color(0xFF2563EB),
                                    size: 20,
                                  ),
                                  SizedBox(width: 8),
                                  Text(
                                    'รายการที่ต้องทำและอุปกรณ์',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF1E293B),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),

                              // Required Tools
                              if (effectiveRequiredTools.isNotEmpty) ...[
                                const Row(
                                  children: [
                                    Icon(
                                      Icons.build_rounded,
                                      size: 16,
                                      color: Color(0xFF64748B),
                                    ),
                                    SizedBox(width: 6),
                                    Text(
                                      'อุปกรณ์ที่ต้องเตรียม:',
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF475569),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 6,
                                  children: effectiveRequiredTools.map((tool) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF1F5F9),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: const Color(0xFFCBD5E1),
                                        ),
                                      ),
                                      child: Text(
                                        tool,
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          color: Color(0xFF334155),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 14),
                              ],

                              // Provided Tools
                              if (effectiveProvidedTools.isNotEmpty) ...[
                                const Row(
                                  children: [
                                    Icon(
                                      Icons.inventory_2_rounded,
                                      size: 16,
                                      color: Color(0xFF16A34A),
                                    ),
                                    SizedBox(width: 6),
                                    Text(
                                      'อุปกรณ์ที่จัดเตรียมให้หน้างาน:',
                                      style: TextStyle(
                                        fontSize: 13.5,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF15803D),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 6,
                                  children: effectiveProvidedTools.map((tool) {
                                    return Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 12,
                                        vertical: 6,
                                      ),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF0FDF4),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(
                                          color: const Color(0xFFBBF7D0),
                                        ),
                                      ),
                                      child: Text(
                                        tool,
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          color: Color(0xFF166534),
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                                const SizedBox(height: 14),
                              ],

                              if (effectiveRequiredTools.isEmpty &&
                                  effectiveProvidedTools.isEmpty) ...[
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF8FAFC),
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: const Color(0xFFE2E8F0),
                                    ),
                                  ),
                                  child: const Row(
                                    children: [
                                      Icon(
                                        Icons.check_circle_outline_rounded,
                                        size: 16,
                                        color: Color(0xFF94A3B8),
                                      ),
                                      SizedBox(width: 6),
                                      Text(
                                        'ไม่มีรายการอุปกรณ์ที่ต้องเตรียมเพิ่มเติม',
                                        style: TextStyle(
                                          fontSize: 12.5,
                                          color: Color(0xFF64748B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 14),
                              ],

                              const Divider(),
                              const SizedBox(height: 12),

                              // Dynamic Duty Title
                              Text(
                                effectiveShiftTitle,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                _assignment.description.isNotEmpty
                                    ? _assignment.description
                                    : 'ปฏิบัติหน้าที่รักษาความปลอดภัยและอำนวยความเรียบร้อยบริเวณ $effectiveDutyLocation',
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: Color(0xFF475569),
                                  height: 1.5,
                                ),
                              ),
                              const SizedBox(height: 12),

                              // Dynamic Checklist points
                              // ..._assignment.patrolChecklist.map(
                              //   (item) => Padding(
                              //     padding: const EdgeInsets.only(bottom: 6),
                              //     child: Row(
                              //       crossAxisAlignment:
                              //           CrossAxisAlignment.start,
                              //       children: [
                              //         const Icon(
                              //           Icons.check_circle_rounded,
                              //           color: Color(0xFF16A34A),
                              //           size: 16,
                              //         ),
                              //         const SizedBox(width: 8),
                              //         Expanded(
                              //           child: Text(
                              //             item,
                              //             style: const TextStyle(
                              //               fontSize: 13.5,
                              //               color: Color(0xFF475569),
                              //             ),
                              //           ),
                              //         ),
                              //       ],
                              //     ),
                              //   ),
                              // ),
                            ],
                          ),
                        ),

                        const SizedBox(height: 20),

                        // // Supervisor Note Card
                        // Container(
                        //   width: double.infinity,
                        //   padding: const EdgeInsets.all(18),
                        //   decoration: BoxDecoration(
                        //     color: const Color(
                        //       0xFFFEF3C7,
                        //     ).withValues(alpha: 0.4),
                        //     borderRadius: BorderRadius.circular(20),
                        //     border: Border.all(color: const Color(0xFFFDE68A)),
                        //   ),
                        //   // child: Column(
                        //   //   crossAxisAlignment: CrossAxisAlignment.start,
                        //   //   children: [
                        //   //     Row(
                        //   //       children: [
                        //   //         const Icon(
                        //   //           Icons.feed_rounded,
                        //   //           color: Color(0xFFD97706),
                        //   //           size: 18,
                        //   //         ),
                        //   //         const SizedBox(width: 8),
                        //   //         Text(
                        //   //           'หมายเหตุจากผู้ดูแล ($effectiveSupervisorName)',
                        //   //           style: const TextStyle(
                        //   //             fontSize: 14.5,
                        //   //             fontWeight: FontWeight.bold,
                        //   //             color: Color(0xFF92400E),
                        //   //           ),
                        //   //         ),
                        //   //       ],
                        //   //     ),
                        //   //     const SizedBox(height: 8),
                        //   //     Text(
                        //   //       _assignment.supervisorNote.isNotEmpty
                        //   //           ? _assignment.supervisorNote
                        //   //           : 'ปฏิบัติตามคำสั่งของหัวหน้าชุดอย่างเคร่งครัด หากพบเหตุผิดปกติให้รายงานสถานการณ์ทันที',
                        //   //       style: const TextStyle(
                        //   //         fontSize: 13.5,
                        //   //         color: Color(0xFF78350F),
                        //   //         height: 1.5,
                        //   //       ),
                        //   //     ),
                        //   //     if (widget.event.contractor.isNotEmpty ||
                        //   //         widget.event.contact.isNotEmpty) ...[
                        //   //       const SizedBox(height: 10),
                        //   //       Row(
                        //   //         children: [
                        //   //           const Icon(
                        //   //             Icons.business_rounded,
                        //   //             size: 14,
                        //   //             color: Color(0xFFB45309),
                        //   //           ),
                        //   //           const SizedBox(width: 6),
                        //   //           Expanded(
                        //   //             child: Text(
                        //   //               'ผู้ว่าจ้าง/สถานที่: ${widget.event.contractor} ${widget.event.contact.isNotEmpty ? '(${widget.event.contact})' : ''}',
                        //   //               style: const TextStyle(
                        //   //                 fontSize: 12,
                        //   //                 color: Color(0xFF92400E),
                        //   //               ),
                        //   //             ),
                        //   //           ),
                        //   //         ],
                        //   //       ),
                        //   //     ],
                        //   //   ],
                        //   // ),
                        // ),
                        const SizedBox(height: 28),

                        // Quick Button to Report Situation
                        SizedBox(
                          width: double.infinity,
                          height: 50,
                          child: ElevatedButton.icon(
                            onPressed: () {
                              if (_userService.isNotStartedYet) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'ยังไม่ถึงเวลาเริ่มงาน ไม่สามารถรายงานสถานการณ์ได้',
                                    ),
                                    backgroundColor: Color(0xFFEF4444),
                                  ),
                                );
                                return;
                              }
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ReportSituationScreen(
                                    event: widget.event,
                                    shift: widget.shift,
                                  ),
                                ),
                              );
                            },
                            icon: const Icon(
                              Icons.shield_rounded,
                              color: Colors.white,
                              size: 20,
                            ),
                            label: const Text(
                              'รายงานสถานการณ์',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15.5,
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
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bg;
    Color fg;
    String label;
    IconData icon;

    switch (status.toUpperCase()) {
      case 'ASSIGNED':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF15803D);
        label = 'ตัวจริง';
        icon = Icons.check_circle_rounded;
        break;
      case 'RESERVE':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFFB45309);
        label = 'ตัวสำรอง';
        icon = Icons.hourglass_top_rounded;
        break;
      case 'WITHDRAWN':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFB91C1C);
        label = 'ถอนตัวแล้ว';
        icon = Icons.cancel_rounded;
        break;
      default:
        bg = const Color(0xFFF1F5F9);
        fg = const Color(0xFF475569);
        label = status.isNotEmpty ? status : 'มอบหมายแล้ว';
        icon = Icons.assignment_turned_in_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.bold,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}

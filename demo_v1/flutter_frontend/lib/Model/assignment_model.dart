class AssignmentModel {
  final int assignmentId;
  final int guardId;
  final int shiftId;
  final int? eventId;
  final String
  assignmentStatus; // ASSIGNED (ตัวจริง), RESERVE (ตัวสำรอง), WITHDRAWN
  final String description;
  final double latitude;
  final double longitude;
  final DateTime? requestDate;
  final String eventName;
  final String dutyLocation;
  final String shiftName;
  final String shiftTime;
  final List<String> requiredTools;
  final List<String> patrolChecklist;
  final String supervisorNote;

  AssignmentModel({
    required this.assignmentId,
    required this.guardId,
    required this.shiftId,
    this.eventId,
    required this.assignmentStatus,
    required this.description,
    this.latitude = 18.898446,
    this.longitude = 99.013074,
    this.requestDate,
    this.eventName = 'งานรักษาความปลอดภัย',
    this.dutyLocation = 'จุดตรวจหลัก',
    this.shiftName = 'กะการทำงาน',
    this.shiftTime = '08:00 - 16:00 น.',
    this.requiredTools = const ['กระบองยาว', 'วิทยุสื่อสาร'],
    this.patrolChecklist = const [
      'เดินตรวจความเรียบร้อยรอบพื้นที่ทุกๆ 2 ชั่วโมง',
      'ตรวจสอบบุคคลและยานพาหนะเข้า-ออก',
      'บันทึกรายงานสถานการณ์ผ่านระบบ SGM',
    ],
    this.supervisorNote =
        'โปรดสังเกตบุคคลและสิ่งผิดปกติเป็นพิเศษ หากพบเหตุให้รายงานสถานการณ์ทันที',
  });

  factory AssignmentModel.fromJson(Map<String, dynamic> json) {
    String formattedShiftTime = '08:00 - 16:00 น.';
    if (json['shift_time'] != null &&
        json['shift_time'].toString().isNotEmpty) {
      formattedShiftTime = json['shift_time'].toString();
    } else if (json['start_time'] != null && json['end_time'] != null) {
      final s = DateTime.tryParse(json['start_time'].toString());
      final e = DateTime.tryParse(json['end_time'].toString());
      if (s != null && e != null) {
        final sH = s.hour.toString().padLeft(2, '0');
        final sM = s.minute.toString().padLeft(2, '0');
        final eH = e.hour.toString().padLeft(2, '0');
        final eM = e.minute.toString().padLeft(2, '0');
        formattedShiftTime = '$sH:$sM - $eH:$eM น.';
      }
    }

    final shiftIdVal = json['shift_id'] ?? json['shiftId'] ?? 0;
    final shiftTitle = json['shift_name'] ?? 'กะงานที่ $shiftIdVal';
    final parsedEventId = json['event_id'] != null
        ? int.tryParse(json['event_id'].toString())
        : (json['eventId'] != null
              ? int.tryParse(json['eventId'].toString())
              : null);

    return AssignmentModel(
      assignmentId: json['assignment_id'] ?? json['id'] ?? 0,
      guardId: json['guard_id'] ?? 0,
      shiftId: shiftIdVal,
      eventId: parsedEventId,
      assignmentStatus: json['assignment_status'] ?? 'ASSIGNED',
      description:
          json['description'] ?? 'เดินตรวจตราพื้นที่และดูแลความเรียบร้อย',
      latitude:
          double.tryParse(json['latitude']?.toString() ?? '') ?? 18.898446,
      longitude:
          double.tryParse(json['longitude']?.toString() ?? '') ?? 99.013074,
      requestDate: json['request_date'] != null
          ? DateTime.tryParse(json['request_date'].toString())
          : null,
      eventName: json['event_name'] ?? json['title'] ?? 'งานรักษาความปลอดภัย',
      dutyLocation: json['duty_location'] ?? json['location'] ?? 'จุดตรวจหลัก',
      shiftName: shiftTitle,
      shiftTime: formattedShiftTime,
      requiredTools:
          (json['required_tools'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const ['กระบองยาว', 'วิทยุสื่อสาร'],
      patrolChecklist:
          (json['patrol_checklist'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [
            'เดินตรวจความเรียบร้อยรอบพื้นที่ทุกๆ 2 ชั่วโมง',
            'ตรวจสอบบุคคลและยานพาหนะเข้า-ออก',
            'บันทึกรายงานสถานการณ์ผ่านระบบ SGM',
          ],
      supervisorNote:
          json['supervisor_note'] ??
          'โปรดสังเกตบุคคลและสิ่งผิดปกติเป็นพิเศษ หากพบเหตุให้รายงานสถานการณ์ทันที',
    );
  }

  String get statusDisplay {
    switch (assignmentStatus.toUpperCase()) {
      case 'ASSIGNED':
        return 'กำลังปฏิบัติงาน';
      case 'RESERVE':
        return 'รอปฏิบัติหน้าที่ (ตัวสำรอง)';
      case 'WITHDRAWN':
        return 'ถอนตัวแล้ว';
      default:
        return assignmentStatus;
    }
  }

  Map<String, dynamic> toJson() => {
    'assignment_id': assignmentId,
    'guard_id': guardId,
    'shift_id': shiftId,
    'event_id': eventId,
    'assignment_status': assignmentStatus,
    'description': description,
    'latitude': latitude.toString(),
    'longitude': longitude.toString(),
    'request_date': requestDate?.toIso8601String(),
    'event_name': eventName,
    'duty_location': dutyLocation,
    'shift_name': shiftName,
    'shift_time': shiftTime,
    'required_tools': requiredTools,
    'patrol_checklist': patrolChecklist,
    'supervisor_note': supervisorNote,
  };
}

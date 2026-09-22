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
  final List<String> providedTools;
  final List<String> patrolChecklist;
  final String supervisorNote;
  final String? supervisorName;
  final String? supervisorPhone;

  AssignmentModel({
    required this.assignmentId,
    required this.guardId,
    required this.shiftId,
    this.eventId,
    required this.assignmentStatus,
    required this.description,
    this.latitude = 0.0,
    this.longitude = 0.0,
    this.requestDate,
    this.eventName = '',
    this.dutyLocation = '',
    this.shiftName = '',
    this.shiftTime = '',
    this.requiredTools = const [],
    this.providedTools = const [],
    this.patrolChecklist = const [],
    this.supervisorNote = '',
    this.supervisorName,
    this.supervisorPhone,
  });

  bool get hasValidCoordinates => latitude != 0.0 && longitude != 0.0;

  factory AssignmentModel.fromJson(Map<String, dynamic> json) {
    String formattedShiftTime = '';
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
    final shiftTitle =
        json['shift_name'] ??
        (shiftIdVal > 0 ? 'กะงานที่ $shiftIdVal' : 'กะการทำงาน');
    final parsedEventId = json['event_id'] != null
        ? int.tryParse(json['event_id'].toString())
        : (json['eventId'] != null
              ? int.tryParse(json['eventId'].toString())
              : null);

    final evName = json['event_name'] ?? json['title'] ?? '';
    final dutyLoc = json['duty_location'] ?? json['location'] ?? '';
    final desc = json['description'] ?? 'ปฏิบัติหน้าที่รักษาความปลอดภัย';

    // Parse tools flexibly (List or comma-separated string)
    List<String> parseTools(dynamic raw) {
      if (raw is List) {
        return raw
            .map((e) => e.toString().trim())
            .where((e) => e.isNotEmpty)
            .toList();
      } else if (raw is String && raw.trim().isNotEmpty) {
        return raw
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList();
      }
      return const [];
    }

    final reqTools = parseTools(json['required_tools']);
    final provTools = parseTools(json['provided_tools']);

    // Parse checklist
    List<String> checklist = [];
    if (json['patrol_checklist'] is List) {
      checklist = (json['patrol_checklist'] as List)
          .map((e) => e.toString().trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }
    if (checklist.isEmpty) {
      // Intelligently derive dynamic checklist from real assignment context
      checklist = [
        formattedShiftTime.isNotEmpty
            ? 'ลงชื่อเข้าปฏิบัติหน้าที่ตามเวลากะ ($formattedShiftTime)'
            : 'ลงชื่อเข้าปฏิบัติหน้าที่ตามเวลากะที่กำหนด',
        dutyLoc.isNotEmpty
            ? 'ประจำการและดูแลความปลอดภัยบริเวณ $dutyLoc'
            : 'ประจำการและดูแลความปลอดภัยบริเวณจุดตรวจที่ได้รับมอบหมาย',
        evName.isNotEmpty
            ? 'ตรวจตราความเรียบร้อยและคัดกรองบุคคลเข้า-ออกพื้นที่ $evName'
            : 'ตรวจตราความเรียบร้อยและคัดกรองบุคคลเข้า-ออกพื้นที่',
        'บันทึกรายงานสถานการณ์ผ่านระบบ SGM และแจ้งเหตุฉุกเฉินทันทีเมื่อพบสิ่งผิดปกติ',
      ];
    }

    final headGuardName =
        json['head_guard_name'] ?? json['headName'] ?? json['supervisor_name'];
    final headGuardPhone =
        json['head_guard_phone'] ??
        json['headPhone'] ??
        json['supervisor_phone'];
    final rawSupervisorNote = json['supervisor_note']?.toString();

    final finalSupervisorNote =
        (rawSupervisorNote != null && rawSupervisorNote.trim().isNotEmpty)
        ? rawSupervisorNote.trim()
        : (headGuardName != null && headGuardName.toString().trim().isNotEmpty
              ? 'ปฏิบัติตามคำสั่งของหัวหน้าชุด (${headGuardName.toString().trim()}) อย่างเคร่งครัด หากมีข้อสงสัยหรือเหตุฉุกเฉินให้ติดต่อหัวหน้าชุดทันที'
              : 'สังเกตบุคคลและสิ่งผิดปกติเป็นพิเศษ และบันทึกรายงานสถานการณ์อย่างสม่ำเสมอ');

    // Parse coordinates, checking assignment coords first, then event fallback
    final lat =
        double.tryParse(json['latitude']?.toString() ?? '') ??
        double.tryParse(json['event_latitude']?.toString() ?? '') ??
        0.0;
    final lng =
        double.tryParse(json['longitude']?.toString() ?? '') ??
        double.tryParse(json['event_longitude']?.toString() ?? '') ??
        0.0;

    return AssignmentModel(
      assignmentId: json['assignment_id'] ?? json['id'] ?? 0,
      guardId: json['guard_id'] ?? 0,
      shiftId: shiftIdVal,
      eventId: parsedEventId,
      assignmentStatus: json['assignment_status'] ?? 'ASSIGNED',
      description: desc,
      latitude: lat,
      longitude: lng,
      requestDate: json['request_date'] != null
          ? DateTime.tryParse(json['request_date'].toString())
          : null,
      eventName: evName,
      dutyLocation: dutyLoc,
      shiftName: shiftTitle,
      shiftTime: formattedShiftTime,
      requiredTools: reqTools,
      providedTools: provTools,
      patrolChecklist: checklist,
      supervisorNote: finalSupervisorNote,
      supervisorName: headGuardName?.toString().trim(),
      supervisorPhone: headGuardPhone?.toString().trim(),
    );
  }

  String get statusDisplay {
    switch (assignmentStatus.toUpperCase()) {
      case 'ASSIGNED':
        return 'กำลังปฏิบัติงาน (ตัวจริง)';
      case 'RESERVE':
        return 'รอปฏิบัติหน้าที่ (ตัวสำรอง)';
      case 'WITHDRAWN':
        return 'ถอนตัวแล้ว';
      default:
        return assignmentStatus;
    }
  }

  AssignmentModel copyWith({
    int? assignmentId,
    int? guardId,
    int? shiftId,
    int? eventId,
    String? assignmentStatus,
    String? description,
    double? latitude,
    double? longitude,
    DateTime? requestDate,
    String? eventName,
    String? dutyLocation,
    String? shiftName,
    String? shiftTime,
    List<String>? requiredTools,
    List<String>? providedTools,
    List<String>? patrolChecklist,
    String? supervisorNote,
    String? supervisorName,
    String? supervisorPhone,
  }) {
    return AssignmentModel(
      assignmentId: assignmentId ?? this.assignmentId,
      guardId: guardId ?? this.guardId,
      shiftId: shiftId ?? this.shiftId,
      eventId: eventId ?? this.eventId,
      assignmentStatus: assignmentStatus ?? this.assignmentStatus,
      description: description ?? this.description,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      requestDate: requestDate ?? this.requestDate,
      eventName: eventName ?? this.eventName,
      dutyLocation: dutyLocation ?? this.dutyLocation,
      shiftName: shiftName ?? this.shiftName,
      shiftTime: shiftTime ?? this.shiftTime,
      requiredTools: requiredTools ?? this.requiredTools,
      providedTools: providedTools ?? this.providedTools,
      patrolChecklist: patrolChecklist ?? this.patrolChecklist,
      supervisorNote: supervisorNote ?? this.supervisorNote,
      supervisorName: supervisorName ?? this.supervisorName,
      supervisorPhone: supervisorPhone ?? this.supervisorPhone,
    );
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
    'provided_tools': providedTools,
    'patrol_checklist': patrolChecklist,
    'supervisor_note': supervisorNote,
    'supervisor_name': supervisorName,
    'supervisor_phone': supervisorPhone,
  };
}

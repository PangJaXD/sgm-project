class WorkingHistoryModel {
  final int historyId;
  final String eventName;
  final String location;
  final DateTime date;
  final String shiftTime;
  final String checkInTime;
  final String status;
  final String assignedDuty;
  final String? reportSummary;

  WorkingHistoryModel({
    required this.historyId,
    required this.eventName,
    required this.location,
    required this.date,
    required this.shiftTime,
    this.checkInTime = 'ตรงเวลา',
    this.status = 'ปฏิบัติงานสำเร็จ',
    this.assignedDuty = 'ตรวจความเรียบร้อยและอำนวยความสะดวก',
    this.reportSummary,
  });

  factory WorkingHistoryModel.fromJson(Map<String, dynamic> json) {
    return WorkingHistoryModel(
      historyId: json['history_id'] ?? json['id'] ?? 0,
      eventName: json['event_name'] ?? json['title'] ?? 'ไม่ระบุชื่องาน',
      location: json['location'] ?? 'ไม่ระบุสถานที่',
      date: json['date'] != null
          ? DateTime.tryParse(json['date'].toString()) ?? DateTime.now()
          : DateTime.now(),
      shiftTime: json['shift_time'] ?? '08:00 - 16:00 น.',
      checkInTime: json['check_in_time'] ?? 'ตรงเวลา (07:45 น.)',
      status: json['status'] ?? 'ปฏิบัติงานสำเร็จ',
      assignedDuty: json['assigned_duty'] ?? 'ตรวจความเรียบร้อยรอบพื้นที่',
      reportSummary: json['report_summary'],
    );
  }

  Map<String, dynamic> toJson() => {
        'history_id': historyId,
        'event_name': eventName,
        'location': location,
        'date': date.toIso8601String(),
        'shift_time': shiftTime,
        'check_in_time': checkInTime,
        'status': status,
        'assigned_duty': assignedDuty,
        'report_summary': reportSummary,
      };

  static const List<String> thaiMonths = [
    '',
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.'
  ];

  static const List<String> thaiFullMonths = [
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
    'ธันวาคม'
  ];

  String get formattedDateThai {
    final thaiYear = date.year > 2500 ? date.year : date.year + 543;
    return '${date.day} ${thaiMonths[date.month]} $thaiYear';
  }

  String get monthGroupThai {
    final thaiYear = date.year > 2500 ? date.year : date.year + 543;
    return '${thaiFullMonths[date.month]} $thaiYear';
  }
}

class ReportRequest {
  final int eventId;
  final String reportType; // e.g. "ROUTINE", "INCIDENT", "SOS"
  final String description;
  final double? latitude;
  final double? longitude;
  final List<String> imageUrls;

  ReportRequest({
    required this.eventId,
    required this.reportType,
    required this.description,
    this.latitude,
    this.longitude,
    this.imageUrls = const [],
  });

  Map<String, dynamic> toJson() => {
    'eventId': eventId,
    'reportType': reportType,
    'description': description,
    'latitude': latitude,
    'longitude': longitude,
    'imageUrls': imageUrls,
  };
}

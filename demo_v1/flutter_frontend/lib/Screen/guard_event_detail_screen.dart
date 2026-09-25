import 'package:flutter/material.dart';
import '../Model/working_history_model.dart';
import '../Service/event_service.dart';
import './event_shift_list_screen.dart';

class GuardEventDetailScreen extends StatelessWidget {
  final EventModel event;

  const GuardEventDetailScreen({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    const primaryBlue = Color(0xFF2563EB);
    const backgroundColor = Color(0xFFF8FAFC);

    final startThai = event.startDate != null
        ? '${event.startDate!.day} ${WorkingHistoryModel.thaiMonths[event.startDate!.month]} ${event.startDate!.year > 2500 ? event.startDate!.year : event.startDate!.year + 543}'
        : 'ไม่ระบุ';
    final endThai = event.endDate != null
        ? '${event.endDate!.day} ${WorkingHistoryModel.thaiMonths[event.endDate!.month]} ${event.endDate!.year > 2500 ? event.endDate!.year : event.endDate!.year + 543}'
        : 'ไม่ระบุ';

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
                    const Text(
                      'รายละเอียดงาน',
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

          // Body Card matching Figure 3.103
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Container(
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
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Title
                    Text(
                      event.title,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Key info table
                    _buildInfoRow(
                      'ผู้ว่าจ้าง',
                      event.contractor.isNotEmpty
                          ? event.contractor
                          : 'ไม่ระบุ',
                    ),
                    const SizedBox(height: 14),
                    _buildInfoRow('วันที่เริ่มงาน', startThai),
                    const SizedBox(height: 14),
                    _buildInfoRow('วันที่สิ้นสุด', endThai),
                    const SizedBox(height: 14),
                    _buildInfoRow('สถานที่จัดงาน', event.location),
                    if (event.contact.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      _buildInfoRow('ช่องทางติดต่อ', event.contact),
                    ],

                    const SizedBox(height: 24),
                    const Divider(),
                    const SizedBox(height: 14),

                    // Description
                    const Text(
                      'รายละเอียด',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      event.description.isNotEmpty
                          ? event.description
                          : 'ดูแลความเรียบร้อยรอบพื้นที่จัดงาน จัดการจราจรทางเข้า-ออก และอำนวยความสะดวกให้แก่ผู้เข้าร่วมงาน',
                      style: const TextStyle(
                        fontSize: 14.5,
                        color: Color(0xFF475569),
                        height: 1.6,
                      ),
                    ),

                    if (event.providedTools.isNotEmpty ||
                        event.requiredTools.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      if (event.providedTools.isNotEmpty) ...[
                        const Text(
                          'อุปกรณ์ที่มีให้',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: event.providedTools
                              .map(
                                (t) => Chip(
                                  label: Text(
                                    t,
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                  backgroundColor: const Color(0xFFEFF6FF),
                                ),
                              )
                              .toList(),
                        ),
                        const SizedBox(height: 14),
                      ],
                    ],

                    const SizedBox(height: 32),

                    // Button "ดูกะงานที่เปิดรับ (List Event Shift)"
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  EventShiftListScreen(event: event),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryBlue,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'ดูกะงานที่เปิดรับ',
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
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 110,
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
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}

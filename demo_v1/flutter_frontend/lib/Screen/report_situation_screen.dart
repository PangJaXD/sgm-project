import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../Model/notification_model.dart';
import '../Service/api_exception.dart';
import '../Service/event_service.dart';

import '../Service/notification_service.dart';
import '../Service/report_service.dart';
import '../Service/user_service.dart';

class ReportSituationScreen extends StatefulWidget {
  final EventModel event;
  final ShiftTimeModel shift;

  const ReportSituationScreen({
    super.key,
    required this.event,
    required this.shift,
  });

  @override
  State<ReportSituationScreen> createState() => _ReportSituationScreenState();
}

class _ReportSituationScreenState extends State<ReportSituationScreen> {
  final ReportService _reportService = ReportService.instance;
  final UserService _userService = UserService();
  final ImagePicker _picker = ImagePicker();

  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  String _selectedUrgency = 'ปานกลาง'; // ด่วนมาก, ปานกลาง, ทั่วไป
  String? _selectedCategory;
  bool _isSubmitting = false;
  final List<XFile> _attachedImages = [];

  final List<String> _categories = [
    'ตรวจความเรียบร้อยทั่วไป',
    'พบบุคคลน่าสงสัย',
    'เหตุทะเลาะวิวาท',
    'ทรัพย์สินสูญหาย / เสียหาย',
    'อุบัติเหตุ / เจ็บป่วยฉุกเฉิน',
    'ปัญหาการจราจร / กีดขวางทางเข้า',
    'เหตุเพลิงไหม้ / กลิ่นไหม้',
    'อื่นๆ',
  ];

  @override
  void initState() {
    super.initState();
    _locationController.text = widget.shift.dutyLocation;
  }

  @override
  void dispose() {
    _locationController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? photo = await _picker.pickImage(
        source: source,
        imageQuality: 80,
        maxWidth: 1600,
      );
      if (photo != null) {
        setState(() {
          _attachedImages.add(photo);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('แนบรูปถ่ายประกอบเรียบร้อยแล้ว'),
              duration: Duration(seconds: 1),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('[ReportSituationScreen] pickImage error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('ไม่สามารถเลือกรูปได้: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showPhotoSourceSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Wrap(
            children: [
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  'เลือกภาพประกอบเหตุการณ์',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt, color: Color(0xFF2563EB)),
                ),
                title: const Text(
                  'ถ่ายภาพด้วยกล้อง (Camera)',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: const Text('ถ่ายภาพเหตุการณ์สดเพื่อเป็นหลักฐาน'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.photo_library,
                    color: Color(0xFF475569),
                  ),
                ),
                title: const Text(
                  'เลือกจากคลังภาพ (Gallery)',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: const Text('เลือกภาพถ่ายที่มีอยู่แล้วในอุปกรณ์'),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleSubmit() async {
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณาเลือกประเภทเหตุการณ์'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (_locationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('กรุณาระบุจุดเกิดเหตุ'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final user = _userService.currentUser;
      final isNormal =
          _selectedUrgency == 'ทั่วไป' &&
          _selectedCategory!.contains('ตรวจความเรียบร้อย');

      await _reportService.submitReport(
        guardId: user.usersId,
        shiftId: widget.shift.shiftId,
        reportType: _selectedCategory!,
        urgency: _selectedUrgency,
        location: _locationController.text.trim(),
        description: _descriptionController.text.trim(),
        isNormal: isNormal,
        images: _attachedImages.map((e) => e.name).toList(),
        imageFiles: _attachedImages,
      );

      // Create confirmation notification in NotificationService
      NotificationService.instance.addNotification(
        NotificationItem(
          id: 'rep-${DateTime.now().millisecondsSinceEpoch}',
          title: 'รายงานสถานการณ์สำเร็จ',
          body:
              'ศูนย์ควบคุมได้รับรายงาน "$_selectedCategory" บริเวณ ${_locationController.text.trim()} แล้ว',
          timestamp: DateTime.now(),
          type: _selectedUrgency == 'ด่วนมาก'
              ? NotificationType.urgent
              : NotificationType.info,
          isRead: false,
        ),
      );

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(22),
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 60,
                  height: 60,
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF16A34A),
                    size: 40,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'ส่งรายงานเหตุการณ์สำเร็จ',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1E293B),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'รายงานของคุณถูกส่งไปยังศูนย์ควบคุมและบันทึกลงในระบบเรียบร้อยแล้ว',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 13.5,
                    color: Color(0xFF64748B),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context); // close dialog
                      Navigator.pop(context); // pop report screen
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'ตกลง',
                      style: TextStyle(
                        color: Colors.white,
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
    const headerColor = Color(
      0xFFE11D48,
    ); // Red/Rose gradient matching Figure 3.121
    const backgroundColor = Color(0xFFF8FAFC);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Top Curved Alert Header matching Figure 3.121
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFFE11D48), Color(0xFFDC2626)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
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
                    const Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'รายงานเหตุการณ์',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 21,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.2,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'ระบบแจ้งเตือนศูนย์ควบคุม',
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Main Form Card
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Container(
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
                    // Urgency Level Selector matching Figure 3.121
                    const Row(
                      children: [
                        Text(
                          'ระดับความรุนแรง',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        Text(
                          ' *',
                          style: TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildUrgencyChip('ด่วนมาก', const Color(0xFFEF4444)),
                        const SizedBox(width: 10),
                        _buildUrgencyChip('ปานกลาง', const Color(0xFFF97316)),
                        const SizedBox(width: 10),
                        _buildUrgencyChip('ทั่วไป', const Color(0xFF2563EB)),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Incident Category Dropdown
                    const Row(
                      children: [
                        Text(
                          'ประเภทเหตุการณ์',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        Text(
                          ' *',
                          style: TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: 'ตรวจความเรียบร้อยทั่วไป',
                      isExpanded: true,
                      hint: const Text(
                        '-- เลือกประเภทเหตุการณ์ --',
                        style: TextStyle(
                          fontSize: 14,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: Color(0xFFE2E8F0),
                          ),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                      ),
                      items: _categories.map((c) {
                        return DropdownMenuItem<String>(
                          value: c,
                          child: Text(
                            c,
                            style: const TextStyle(fontSize: 13.5),
                            overflow: TextOverflow.ellipsis,
                          ),
                        );
                      }).toList(),
                      onChanged: (val) =>
                          setState(() => _selectedCategory = val),
                    ),

                    const SizedBox(height: 20),

                    // Incident Location
                    const Row(
                      children: [
                        Text(
                          'จุดเกิดเหตุ',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        Text(
                          ' *',
                          style: TextStyle(
                            color: Colors.red,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _locationController,
                      decoration: InputDecoration(
                        hintText: 'ระบุสถานที่ให้ชัดเจน (เช่น ลานจอดรถโซน E)',
                        hintStyle: const TextStyle(
                          fontSize: 13.5,
                          color: Color(0xFF94A3B8),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: Color(0xFFE2E8F0),
                          ),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                      ),
                    ),

                    const SizedBox(height: 20),

                    // Incident Description
                    const Text(
                      'รายละเอียดเหตุการณ์',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _descriptionController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'อธิบายสิ่งที่เกิดขึ้น...',
                        hintStyle: const TextStyle(
                          fontSize: 13.5,
                          color: Color(0xFF94A3B8),
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: const BorderSide(
                            color: Color(0xFFE2E8F0),
                          ),
                        ),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                      ),
                    ),

                    const SizedBox(height: 22),

                    // Photo Attachments Box
                    const Text(
                      'แนบรูปภาพประกอบ (ถ้ามี)',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E293B),
                      ),
                    ),
                    const SizedBox(height: 10),
                    InkWell(
                      onTap: _showPhotoSourceSheet,
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 24),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: const Color(0xFFCBD5E1),
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Column(
                          children: [
                            const Icon(
                              Icons.add_a_photo_outlined,
                              color: Color(0xFF2563EB),
                              size: 32,
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _attachedImages.isEmpty
                                  ? 'คลิกเพื่อถ่ายภาพหรือเลือกไฟล์รูป'
                                  : 'แนบแล้ว ${_attachedImages.length} รูป (คลิกเพื่อเพิ่มอีก)',
                              style: const TextStyle(
                                fontSize: 13,
                                color: Color(0xFF64748B),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    if (_attachedImages.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: _attachedImages.map((file) {
                          return Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Container(
                                width: 84,
                                height: 84,
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: const Color(0xFFCBD5E1),
                                    width: 1.5,
                                  ),
                                ),
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(10.5),
                                  child: kIsWeb
                                      ? Image.network(
                                          file.path,
                                          fit: BoxFit.cover,
                                        )
                                      : Image.file(
                                          File(file.path),
                                          fit: BoxFit.cover,
                                        ),
                                ),
                              ),
                              Positioned(
                                top: -6,
                                right: -6,
                                child: GestureDetector(
                                  onTap: () {
                                    setState(
                                      () => _attachedImages.remove(file),
                                    );
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black26,
                                          blurRadius: 4,
                                        ),
                                      ],
                                    ),
                                    child: const Icon(
                                      Icons.close,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          );
                        }).toList(),
                      ),
                    ],

                    const SizedBox(height: 32),

                    // Submit Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        onPressed: _isSubmitting ? null : _handleSubmit,
                        icon: const Icon(
                          Icons.send_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                        label: _isSubmitting
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : const Text(
                                'ส่งรายงานเหตุการณ์',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: headerColor,
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
          ),
        ],
      ),
    );
  }

  Widget _buildUrgencyChip(String label, Color color) {
    final isSelected = _selectedUrgency == label;

    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedUrgency = label),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected
                ? color.withValues(alpha: 0.12)
                : const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? color : const Color(0xFFE2E8F0),
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Center(
            child: Text(
              label,
              style: TextStyle(
                color: isSelected ? color : const Color(0xFF64748B),
                fontSize: 14,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class UserModel {
  final int usersId;
  final String username;
  final String firstName;
  final String lastName;
  final String phone;
  final String address;
  final String userDetail;
  final DateTime? startDate;
  final DateTime? quitDate;
  final String profileImg;
  final String role; // "GUARD", "HEAD_GUARD", "ADMIN", "COMPANY"
  final double? performanceScore;
  final String? companyName;
  final String? headName;

  UserModel({
    required this.usersId,
    required this.username,
    required this.firstName,
    required this.lastName,
    this.phone = '081-234-5678',
    this.address = 'โซนมหาวิทยาลัยแม่โจ้ และ เชียงใหม่',
    this.userDetail = '-',
    this.startDate,
    this.quitDate,
    this.profileImg = 'default.png',
    this.role = 'GUARD',
    this.performanceScore,
    this.companyName,
    this.headName,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      usersId: json['users_id'] ?? json['id'] ?? 42,
      username: json['username']?.toString() ?? '',
      firstName: json['first_name']?.toString() ?? 'ธนภัทร',
      lastName: json['last_name']?.toString() ?? 'หมอยา',
      phone: json['phone']?.toString() ?? '081-234-5678',
      address:
          json['address']?.toString() ?? 'โซนมหาวิทยาลัยแม่โจ้ และ เชียงใหม่',
      userDetail: json['user_detail']?.toString() ?? '-',
      startDate: json['start_date'] != null
          ? DateTime.tryParse(json['start_date'].toString())
          : DateTime(2026, 1, 1),
      quitDate: json['quit_date'] != null
          ? DateTime.tryParse(json['quit_date'].toString())
          : null,
      profileImg: json['profile_img']?.toString() ?? 'default.png',
      role: json['role']?.toString() ?? 'GUARD',
      performanceScore: json['performance_score'] != null
          ? double.tryParse(json['performance_score'].toString())
          : null,
      companyName: json['company_name']?.toString(),
      headName: json['head_name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() => {
        'users_id': usersId,
        'username': username,
        'first_name': firstName,
        'last_name': lastName,
        'phone': phone,
        'address': address,
        'user_detail': userDetail,
        'start_date': startDate?.toIso8601String(),
        'quit_date': quitDate?.toIso8601String(),
        'profile_img': profileImg,
        'role': role,
        'performance_score': performanceScore,
        'company_name': companyName,
        'head_name': headName,
      };

  String get fullName => '$firstName $lastName'.trim();

  String get employeeIdDisplay {
    final year = startDate != null ? startDate!.year : 2026;
    final paddedId = usersId.toString().padLeft(3, '0');
    return 'ID: SEC-$year-$paddedId';
  }

  String get roleTitle {
    switch (role.toUpperCase()) {
      case 'HEAD_GUARD':
        return 'หัวหน้าชุดรักษาความปลอดภัย';
      case 'ADMIN':
        return 'ผู้ดูแลระบบ';
      case 'COMPANY':
        return 'ตัวแทนบริษัท';
      case 'GUARD':
      default:
        return 'เจ้าหน้าที่ปฏิบัติการทั่วไป';
    }
  }

  String get formattedPhone {
    final clean = phone.replaceAll(RegExp(r'[^0-9]'), '');
    if (clean.length == 10) {
      return '${clean.substring(0, 3)}-${clean.substring(3, 6)}-${clean.substring(6)}';
    }
    return phone;
  }

  UserModel copyWith({
    String? phone,
    String? address,
    String? userDetail,
  }) {
    return UserModel(
      usersId: usersId,
      username: username,
      firstName: firstName,
      lastName: lastName,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      userDetail: userDetail ?? this.userDetail,
      startDate: startDate,
      quitDate: quitDate,
      profileImg: profileImg,
      role: role,
      performanceScore: performanceScore,
      companyName: companyName,
      headName: headName,
    );
  }
}


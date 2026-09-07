import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../Model/auth_api_screen.dart';
import '../Model/user_model.dart';

class UserService extends ChangeNotifier {
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  UserModel _currentUser = UserModel(
    usersId: 42,
    username: 'mr.kopp',
    firstName: 'ธนภัทร',
    lastName: 'หมอยา',
    phone: '081-234-5678',
    address: 'โซนมหาวิทยาลัยแม่โจ้ และ เชียงใหม่',
    userDetail: 'ปฏิบัติการสายตรวจกลางวันและกลางคืน',
    startDate: DateTime(2026, 1, 15),
    role: 'GUARD',
    companyName: 'SGM Security Group',
  );

  UserModel get currentUser => _currentUser;

  void setUser(UserModel user) {
    _currentUser = user;
    notifyListeners();
  }

  void setUserFromLoginResponse(Map<String, dynamic> data) {
    _currentUser = UserModel(
      usersId: data['users_id'] ?? _currentUser.usersId,
      username: data['username'] ?? _currentUser.username,
      firstName: data['first_name'] ?? _currentUser.firstName,
      lastName: data['last_name'] ?? _currentUser.lastName,
      phone: data['phone'] ?? _currentUser.phone,
      address: data['address'] ?? _currentUser.address,
      role: data['role'] ?? _currentUser.role,
      startDate: _currentUser.startDate,
      userDetail: _currentUser.userDetail,
      companyName: data['company_name'] ?? _currentUser.companyName,
    );
    notifyListeners();

    // Optionally fetch full profile details in background
    if (data['users_id'] != null && data['role'] != null) {
      fetchUserProfile(data['users_id'], data['role']);
    }
  }

  Future<void> fetchUserProfile(int userId, String role) async {
    try {
      final dio = Dio(
        BaseOptions(
          baseUrl: AuthApiService.baseUrl,
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
          headers: {'Content-Type': 'application/json'},
        ),
      );

      final endpoint = role.toUpperCase() == 'HEAD_GUARD'
          ? '/headguard/$userId'
          : '/guard/$userId';

      final response = await dio.get(endpoint);
      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        _currentUser = UserModel.fromJson(response.data as Map<String, dynamic>);
        notifyListeners();
      }
    } catch (_) {
      // Ignore background fetch error, keep current active model
    }
  }

  void updatePhone(String newPhone) {
    _currentUser = _currentUser.copyWith(phone: newPhone);
    notifyListeners();
  }

  void updateAddress(String newAddress) {
    _currentUser = _currentUser.copyWith(address: newAddress);
    notifyListeners();
  }

  void logout() {
    _currentUser = UserModel(
      usersId: 42,
      username: '',
      firstName: 'ธนภัทร',
      lastName: 'หมอยา',
      phone: '081-234-5678',
      address: 'โซนมหาวิทยาลัยแม่โจ้ และ เชียงใหม่',
      role: 'GUARD',
    );
    notifyListeners();
  }
}


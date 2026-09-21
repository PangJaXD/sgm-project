import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../Model/auth_api_screen.dart';
import '../Model/user_model.dart';
import './api_exception.dart';

class UserService extends ChangeNotifier {
  static final UserService _instance = UserService._internal();
  factory UserService() => _instance;
  UserService._internal();

  // Initial user matching real database Guard (wan.yen, id: 10, 'ฉัตรชัย แสงธรรม')
  UserModel _currentUser = UserModel(
    usersId: 10,
    username: 'wan.yen',
    firstName: 'ฉัตรชัย',
    lastName: 'แสงธรรม',
    phone: '081-234-5678',
    address: 'โซนมหาวิทยาลัยแม่โจ้ และ เชียงใหม่',
    userDetail: 'มีพื้นฐานยิวยิตสู ปฏิบัติการสายตรวจ',
    startDate: DateTime(2026, 8, 11),
    role: 'GUARD',
    companyName: 'ABC Security Company',
    headName: 'ธนเรศ หมอยา',
  );

  UserModel get currentUser => _currentUser;

  Dio _createDio() {
    return Dio(
      BaseOptions(
        baseUrl: AuthApiService.baseUrl,
        connectTimeout: const Duration(seconds: 6),
        receiveTimeout: const Duration(seconds: 8),
        headers: {'Content-Type': 'application/json'},
      ),
    );
  }

  void setUser(UserModel user) {
    _currentUser = user;
    notifyListeners();
  }

  Future<void> setUserFromLoginResponse(Map<String, dynamic> data) async {
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
      headName: data['head_name'] ?? _currentUser.headName,
    );
    notifyListeners();

    if (data['users_id'] != null && data['role'] != null) {
      await fetchUserProfile(data['users_id'] as int, data['role']?.toString());
    }
  }

  /// Fetch full user profile from backend: GET /api/guard/{userId}
  Future<void> fetchUserProfile(int userId, [String? role]) async {
    try {
      final userRole = (role ?? _currentUser.role).toUpperCase();
      final endpoint = userRole == 'HEAD_GUARD'
          ? '/headguard/$userId'
          : '/guard/$userId';
      final response = await _createDio().get(endpoint);

      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        _currentUser = UserModel.fromJson(
          response.data as Map<String, dynamic>,
        );
        notifyListeners();
      }
    } on DioException catch (e) {
      debugPrint('[UserService] fetchUserProfile Dio error: ${e.message}');
    } catch (e) {
      debugPrint('[UserService] fetchUserProfile error: $e');
    }
  }

  /// Update phone number and persist to backend: PUT /api/guard/{userId}
  Future<bool> updatePhone(String newPhone) async {
    _currentUser = _currentUser.copyWith(phone: newPhone);
    notifyListeners();

    try {
      final endpoint = _currentUser.role.toUpperCase() == 'HEAD_GUARD'
          ? '/headguard/${_currentUser.usersId}'
          : '/guard/${_currentUser.usersId}';

      final response = await _createDio().put(
        endpoint,
        data: _currentUser.toJson(),
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      debugPrint('[UserService] updatePhone persist error: $e');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[UserService] updatePhone persist error: $e');
      rethrow;
    }
  }

  /// Update address and persist to backend: PUT /api/guard/{userId}
  Future<bool> updateAddress(String newAddress) async {
    _currentUser = _currentUser.copyWith(address: newAddress);
    notifyListeners();

    try {
      final endpoint = _currentUser.role.toUpperCase() == 'HEAD_GUARD'
          ? '/headguard/${_currentUser.usersId}'
          : '/guard/${_currentUser.usersId}';

      final response = await _createDio().put(
        endpoint,
        data: _currentUser.toJson(),
      );
      return response.statusCode == 200;
    } on DioException catch (e) {
      debugPrint('[UserService] updateAddress persist error: $e');
      throw ApiException.fromDioException(e);
    } catch (e) {
      debugPrint('[UserService] updateAddress persist error: $e');
      rethrow;
    }
  }

  void logout() {
    _currentUser = UserModel(
      usersId: 0,
      username: '',
      firstName: 'ผู้ใช้งาน',
      lastName: '',
      phone: '-',
      address: '-',
      role: 'GUARD',
    );
    notifyListeners();
  }
}

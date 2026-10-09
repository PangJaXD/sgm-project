import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../Model/auth_api_screen.dart';
import '../Model/user_model.dart';
import './api_exception.dart';
import './event_service.dart';

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
    startDate: DateTime(2026, 8, 11),
    role: 'GUARD',
    companyName: 'ABC Security Company',
    headName: 'ธนเรศ หมอยา',
  );

  UserModel get currentUser => _currentUser;
  bool get isNotStartedYet => _currentUser.isNotStartedYet;
  bool get isSuspendedOrLayoff => _currentUser.isSuspendedOrLayoff;

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
    DateTime? parsedStartDate;
    if (data['start_date'] != null) {
      parsedStartDate = DateTime.tryParse(data['start_date'].toString());
    }

    final userRole = data['role']?.toString() ?? _currentUser.role;
    final fName = data['first_name'] ?? _currentUser.firstName;
    final lName = data['last_name'] ?? _currentUser.lastName;
    final ownHeadName = userRole.toUpperCase() == 'HEAD_GUARD'
        ? '$fName $lName'.trim()
        : (data['head_name'] ?? _currentUser.headName);

    _currentUser = UserModel(
      usersId: data['users_id'] ?? _currentUser.usersId,
      username: data['username'] ?? _currentUser.username,
      firstName: fName,
      lastName: lName,
      phone: data['phone'] ?? _currentUser.phone,
      address: data['address'] ?? _currentUser.address,
      role: userRole,
      status: data['status']?.toString() ?? _currentUser.status,
      startDate: parsedStartDate ?? _currentUser.startDate,
      companyName: data['company_name'] ?? _currentUser.companyName,
      headName: ownHeadName,
    );
    notifyListeners();

    if (data['users_id'] != null && data['role'] != null) {
      await fetchUserProfile(data['users_id'] as int, userRole);
    }

    final currentId = data['users_id'] is int
        ? data['users_id'] as int
        : (int.tryParse(data['users_id']?.toString() ?? '') ?? _currentUser.usersId);
    if (currentId > 0 && userRole.toUpperCase() == 'GUARD') {
      await EventService.instance.syncGuardAppliedShifts(currentId);
    }
  }

  /// Fetch full user profile from backend: GET /api/guard/{userId} or /api/headguard/{userId}
  Future<void> fetchUserProfile(int userId, [String? role]) async {
    try {
      final userRole = (role ?? _currentUser.role).toUpperCase();
      final endpoint = userRole == 'HEAD_GUARD'
          ? '/headguard/$userId'
          : '/guard/$userId';
      final response = await _createDio().get(endpoint);

      if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
        final profileData = Map<String, dynamic>.from(response.data as Map);
        if (profileData['role'] == null || profileData['role'].toString().isEmpty) {
          profileData['role'] = userRole;
        }
        if (userRole == 'HEAD_GUARD') {
          profileData['head_name'] =
              '${profileData['first_name'] ?? _currentUser.firstName} ${profileData['last_name'] ?? _currentUser.lastName}'.trim();
        }
        _currentUser = UserModel.fromJson(profileData);
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
    EventService.instance.clearRequestedShifts();
    notifyListeners();
  }
}

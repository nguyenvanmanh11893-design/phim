import 'package:flutter/material.dart';
import '../../../data/models/user_model.dart';
import '../../../data/repositories/user_repository.dart';

class ProfileProvider extends ChangeNotifier {
  final UserRepository _repository = UserRepository();

  UserModel? _user;
  bool _isLoading = false;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchProfile() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _repository.getProfile();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateProfile({String? name, String? phone, String? dob, String? avatarUrl}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final Map<String, dynamic> data = {};
      if (name != null && name.isNotEmpty) data['name'] = name;
      if (phone != null && phone.isNotEmpty) data['phone'] = phone;
      if (dob != null && dob.isNotEmpty) data['dateOfBirth'] = dob;
      if (avatarUrl != null && avatarUrl.isNotEmpty) data['avatarUrl'] = avatarUrl;

      _user = await _repository.updateProfile(data);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> changePassword(String oldPassword, String newPassword) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.changePassword(oldPassword, newPassword);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
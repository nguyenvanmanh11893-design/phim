import 'package:flutter/material.dart';
import '../../../data/repositories/auth_repository.dart';

class AuthProvider extends ChangeNotifier {
  final AuthRepository _repository = AuthRepository();
  
  bool _isLoading = false;
  bool get isLoading => _isLoading;

  String? _errorMessage;
  String? get errorMessage => _errorMessage;

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  Future<bool> loginWithEmail(String email, String password) async {
    _setLoading(true);
    _errorMessage = null;
    try {
      await _repository.loginWithEmail(email, password);
      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<bool> loginWithFacebook() async {
    _setLoading(true);
    _errorMessage = null;
    try {
      await _repository.loginWithFacebook();
      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<bool> loginWithGoogle() async {
    _setLoading(true);
    _errorMessage = null;
    try {
      await _repository.loginWithGoogle();
      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _setLoading(false);
      return false;
    }
  }

  Future<bool> register(String email, String username, String password) async {
    _setLoading(true);
    _errorMessage = null;
    try {
      await _repository.register(email, username, password);
      _setLoading(false);
      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _setLoading(false);
      return false;
    }
  }

  // Thêm vào trong class AuthProvider
Future<void> logout() async {
  _setLoading(true);
  try {
    await _repository.logout();
  } catch (e) {
    print('Lỗi đăng xuất: $e');
  } finally {
    _setLoading(false);
  }
}
}


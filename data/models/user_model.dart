class UserModel {
  final int id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? dateOfBirth;
  final String? avatarUrl;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    this.phone,
    this.dateOfBirth,
    this.avatarUrl,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'user',
      phone: json['phone'],
      dateOfBirth: json['dateOfBirth'],
      avatarUrl: json['avatarUrl'],
    );
  }
}
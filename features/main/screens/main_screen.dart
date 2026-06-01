import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';
import '../../home/screens/home_screen.dart';
import '../../movie/screens/movie_screen.dart';
import '../../profile/screens/profile_screen.dart'; 
// ================================================================
// MAIN SCREEN - Nơi quản lý Bottom Navigation Bar CỐ ĐỊNH
// ================================================================
// MỤC ĐÍCH:
//   - Quản lý 4 màn hình chính (Trang chủ, Vé, Phim, Hồ sơ)
//   - Bottom navigation bar CỐ ĐỊNH ở dưới, không bị cuốn khi scroll
//   - Chuyển đổi giữa các màn hình mà KHÔNG cần reload lại toàn bộ
// ================================================================
// CÁCH HOẠT ĐỘNG:
//   1. Người dùng nhấn vào icon trên bottom bar
//   2. _currentIndex thay đổi (0,1,2,3)
//   3. Scaffold hiển thị widget tương ứng trong _screens[_currentIndex]
//   4. Bottom bar vẫn giữ nguyên, không thay đổi
// ================================================================
// LƯU Ý QUAN TRỌNG:
//   - Các màn hình con (HomeScreen, MovieScreen) KHÔNG có bottom nav riêng
//   - Tất cả bottom nav đều tập trung tại file NÀY
//   - Khi thêm màn hình mới, chỉ cần thêm vào _screens và _navItems
// ================================================================
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const TicketScreen(),
    const MovieScreen(),
    const ProfileScreen(),
  ];

  final List<NavItem> _navItems = const [
    NavItem(Icons.home, 'Trang chủ'),
    NavItem(Icons.confirmation_num_outlined, 'Vé'),
    NavItem(Icons.movie_outlined, 'Phim'),
    NavItem(Icons.person_outline, 'Hồ sơ'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _screens[_currentIndex],
      bottomNavigationBar: _buildBottomNavBar(),
    );
  }

  Widget _buildBottomNavBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(30)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: List.generate(
            _navItems.length,
                (index) => _buildNavItem(_navItems[index], index),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(NavItem item, int index) {
    final isSelected = _currentIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _currentIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            item.icon,
            color: isSelected ? AppColors.secondary : AppColors.textSecondary,
            size: 30,
          ),
          const SizedBox(height: 4),
          Text(
            item.label,
            style: AppTextStyles.bodyMedium.copyWith(
              color: isSelected ? AppColors.secondary : AppColors.textSecondary,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

class NavItem {
  final IconData icon;
  final String label;
  const NavItem(this.icon, this.label);
}

// Temporary screens
class TicketScreen extends StatelessWidget {
  const TicketScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: const Center(
        child: Text('Ticket Screen', style: TextStyle(color: Colors.white)),
      ),
    );
  }
}
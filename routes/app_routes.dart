import 'package:flutter/material.dart';
import '../features/auth/screens/welcome_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/main/screens/main_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/movie/screens/movie_screen.dart';


class AppRoutes {
  static const String home = '/';
  static const String movie = '/movie';
  static const String welcome = '/welcome';
  static const String login = '/login';
  static const String register = '/register';
  static const String main = '/main';

  static Map<String, WidgetBuilder> get routes {
    return {
      welcome: (context) => const WelcomeScreen(),
      login: (context) => LoginScreen(),
      register: (context) => RegisterScreen(),
      main: (context) => const MainScreen(),
      home: (context) => HomeScreen(),
      movie: (context) => const MovieScreen(),
    };
  }
}
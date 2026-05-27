// lib/app.dart
import 'package:flutter/material.dart';
import 'package:device_preview/device_preview.dart'; // Thêm dòng này

import 'core/theme/app_theme.dart';
import 'routes/app_routes.dart'; 

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // --- Thêm 2 dòng này để kết nối với Device Preview ---
      locale: DevicePreview.locale(context),
      builder: DevicePreview.appBuilder,
      // ---------------------------------------------------
      
      title: 'Movie App',
      theme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      initialRoute: AppRoutes.welcome, 
      routes: AppRoutes.routes,
    );
  }
}
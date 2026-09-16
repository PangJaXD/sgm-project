import 'package:flutter/material.dart';
import './Screen/login_screen.dart';
import './Screen/home_screen.dart';
import './Screen/profile_screen.dart';
import './Screen/notification_screen.dart';
import './Screen/working_history_screen.dart';
import './Service/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await NotificationService.instance.init();
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SGM Guard App',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const LoginScreen(),
        '/home': (context) => const HomeScreen(),
        '/profile': (context) => const ProfileScreen(showBottomNav: true),
        '/notifications': (context) => const NotificationScreen(isTab: false),
        '/history': (context) => const WorkingHistoryScreen(),
      },
    );
  }
}

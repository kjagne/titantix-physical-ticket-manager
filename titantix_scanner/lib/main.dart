import 'package:flutter/material.dart';
import 'screens/scanner_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const TitantixScannerApp());
}

class TitantixScannerApp extends StatelessWidget {
  const TitantixScannerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Titantix Scanner',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
        useMaterial3: true,
      ),
      home: HomeScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

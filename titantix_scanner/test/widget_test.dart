// Titantix Scanner Widget Tests

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:titantix_scanner/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const TitantixScannerApp());

    // Verify that the app title is present
    expect(find.text('Titantix Scanner'), findsOneWidget);
    
    // Verify that the home screen elements are present
    expect(find.text('Offline Ticket Scanner'), findsOneWidget);
    expect(find.text('START SCANNING'), findsOneWidget);
    expect(find.text('SYNC TICKETS FROM SERVER'), findsOneWidget);
  });
}

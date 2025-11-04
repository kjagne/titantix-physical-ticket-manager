import 'dart:convert';
import 'package:crypto/crypto.dart';

class CryptoService {
  // This must match the secret key from your web app
  static const String MOCK_SECRET_KEY = "a-very-secret-key-for-titan-tix-demo";

  // Verify token signature
  static Future<bool> verifyToken(String token) async {
    try {
      final parts = token.split('.');
      if (parts.length != 2) {
        return false;
      }

      final encodedPayload = parts[0];
      final signature = parts[1];

      // Recreate the signature
      final signatureInput = '$encodedPayload.$MOCK_SECRET_KEY';
      final expectedSignature = await _simpleHash(signatureInput);

      return signature == expectedSignature;
    } catch (e) {
      print('Token verification error: $e');
      return false;
    }
  }

  // Extract serial from token
  static Future<String?> getSerialFromToken(String token) async {
    try {
      final parts = token.split('.');
      if (parts.length != 2) {
        return null;
      }

      final encodedPayload = parts[0];
      final decodedPayload = utf8.decode(base64.decode(encodedPayload));
      final payload = json.decode(decodedPayload);

      return payload['s'];
    } catch (e) {
      print('Error extracting serial from token: $e');
      return null;
    }
  }

  // Simple hash function (matches web app)
  static Future<String> _simpleHash(String data) async {
    final bytes = utf8.encode(data);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }
}

class Ticket {
  final String serial;
  final String token;
  final String ticketTypeName;
  final int price;
  final String status; // UNSOLD, SOLD, USED
  final String? usedAt;
  final String? usedByDevice;
  final bool synced;

  Ticket({
    required this.serial,
    required this.token,
    required this.ticketTypeName,
    required this.price,
    required this.status,
    this.usedAt,
    this.usedByDevice,
    this.synced = true,
  });

  Map<String, dynamic> toMap() {
    return {
      'serial': serial,
      'token': token,
      'ticketTypeName': ticketTypeName,
      'price': price,
      'status': status,
      'usedAt': usedAt,
      'usedByDevice': usedByDevice,
      'synced': synced ? 1 : 0,
    };
  }

  factory Ticket.fromMap(Map<String, dynamic> map) {
    return Ticket(
      serial: map['serial'],
      token: map['token'],
      ticketTypeName: map['ticketTypeName'],
      price: map['price'],
      status: map['status'],
      usedAt: map['usedAt'],
      usedByDevice: map['usedByDevice'],
      synced: map['synced'] == 1,
    );
  }

  factory Ticket.fromJson(Map<String, dynamic> json) {
    return Ticket(
      serial: json['serial'],
      token: json['token'],
      ticketTypeName: json['ticketTypeName'],
      price: json['price'],
      status: json['status'],
      usedAt: json['usedAt'],
      usedByDevice: json['usedByDevice'],
      synced: true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'serial': serial,
      'token': token,
      'ticketTypeName': ticketTypeName,
      'price': price,
      'status': status,
      'usedAt': usedAt,
      'usedByDevice': usedByDevice,
    };
  }
}

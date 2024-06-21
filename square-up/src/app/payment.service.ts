import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getLocationId(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/get-location-id`);
  }

  createOrder(orderRequest: OrderRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-order`, orderRequest);
  }

  processPayment(paymentRequest: PaymentRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/process-payment`, paymentRequest);
  }
}

export interface OrderRequest {
  items: { name: string; quantity: string; price: number }[];
}

export interface PaymentRequest {
  amount: number;
  nonce: string;
  orderId: string;
}

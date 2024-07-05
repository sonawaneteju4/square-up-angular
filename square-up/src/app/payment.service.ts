import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl =
    'https://reimagined-fishstick-4pxjw5wpjqphj549-4200.app.github.dev/api';

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
  locationId: string;
  amount: number;
  currency: string;
  lineItems: OrderLineItemRequest[];
}

export interface OrderLineItemRequest {
  name: string;
  quantity: number;
  price: number;
}

export interface PaymentRequest {
  nonce: string;
  orderId: string;
}

import { Component, OnInit } from '@angular/core';
import {
  PaymentService,
  OrderRequest,
  PaymentRequest,
} from './payment.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
})
export class AppComponent implements OnInit {
  private appId = 'sandbox-sq0idb-TEAiLY52bxRBdOZqkr4zcA';
  private locationId: string | null = null;
  private payments: any; // To store the payments instance
  private card: any; // To store the initialized card instance

  constructor(private paymentService: PaymentService) {}

  ngOnInit() {
    this.loadSquare();
    this.fetchLocationId();
  }

  fetchLocationId() {
    this.paymentService.getLocationId().subscribe({
      next: (response: any) => {
        this.locationId = response.locationId; // Assuming response is { "locationId": "L2SANBZ4MQDYV" }
      },
      error: (err) => {
        console.error('Failed to fetch location ID', err);
      },
    });
  }

  async loadSquare() {
    if (!window.Square) {
      throw new Error('Square.js failed to load properly');
    }

    try {
      this.payments = window.Square.payments(this.appId, this.locationId);
      await this.initializeCard();
    } catch (e) {
      console.error('Square payments initialization failed', e);
    }
  }

  async initializeCard() {
    try {
      this.card = await this.payments.card();
      await this.card.attach('#card-container');
    } catch (e) {
      console.error('Initializing Card failed', e);
    }
  }

  async handlePaymentMethodSubmission(event: Event) {
    event.preventDefault();

    const cardButton = document.getElementById(
      'card-button'
    ) as HTMLButtonElement | null;
    if (!cardButton) {
      console.error('Card button not found');
      return;
    }

    cardButton.disabled = true;

    try {
      if (!this.card) {
        throw new Error('Card not initialized');
      }

      const token = await this.tokenize(this.card);

      // Create order before processing payment
      const orderRequest: OrderRequest = {
        locationId: 'L2SANBZ4MQDYV',
        amount: 1000, // Total amount in cents ($10.00)
        currency: 'USD',
        lineItems: [
          {
            name: 'Item 1',
            quantity: 1,
            price: 1000, // Price of the item in cents ($10.00)
          },
        ],
      };
      const orderResponse = await this.paymentService
        .createOrder(orderRequest)
        .toPromise();

      const paymentRequest: PaymentRequest = {
        nonce: token,
        orderId: 'hccgHITRASefqsyNPq1lvJNEuQFZY',
      };

      const paymentResults = await this.paymentService
        .processPayment(paymentRequest)
        .toPromise();

      this.displayPaymentResults('SUCCESS');
      console.debug('Payment Success', paymentResults);
    } catch (e) {
      console.error('Payment failed', e);
      this.displayPaymentResults('FAILURE');
    }

    cardButton.disabled = false;
  }

  async tokenize(paymentMethod: any) {
    const tokenResult = await paymentMethod.tokenize();
    if (tokenResult.status === 'OK') {
      return tokenResult.token;
    } else {
      let errorMessage = `Tokenization failed with status: ${tokenResult.status}`;
      if (tokenResult.errors) {
        errorMessage += ` and errors: ${JSON.stringify(tokenResult.errors)}`;
      }
      throw new Error(errorMessage);
    }
  }

  displayPaymentResults(status: string) {
    const statusContainer = document.getElementById('payment-status-container');
    if (!statusContainer) {
      console.error('Payment status container not found');
      return;
    }

    if (status === 'SUCCESS') {
      statusContainer.classList.remove('is-failure');
      statusContainer.classList.add('is-success');
    } else {
      statusContainer.classList.remove('is-success');
      statusContainer.classList.add('is-failure');
    }

    statusContainer.style.visibility = 'visible';
  }
}

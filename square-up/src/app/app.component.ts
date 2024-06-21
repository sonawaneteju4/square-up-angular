import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone : true,
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private appId = 'YOUR_APPLICATION_ID';
  private locationId = 'YOUR_LOCATION_ID';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadSquare();
  }

  async loadSquare() {
    if (!window.Square) {
      throw new Error('Square.js failed to load properly');
    }

    const statusContainer = document.getElementById('payment-status-container');
    if (!statusContainer) {
      throw new Error('Payment status container not found');
    }

    statusContainer.className = 'missing-credentials';
    statusContainer.style.visibility = 'visible';

    let payments;
    try {
      payments = window.Square.payments(this.appId, this.locationId);
    } catch (e) {
      console.error('Square payments initialization failed', e);
      return;
    }

    let cardButton = document.getElementById('card-button') as HTMLButtonElement | null;
    if (!cardButton) {
      console.error('Card button not found');
      return;
    }

    cardButton.addEventListener('click', async (event) => {
      await this.handlePaymentMethodSubmission(event, payments);
    });

    let card: any; // Replace 'any' with the actual type of card from Square.js

    try {
      card = await this.initializeCard(payments);
    } catch (e) {
      console.error('Initializing Card failed', e);
      return;
    }

    cardButton.disabled = false;

    const token = await this.tokenize(card);
    const verificationToken = await this.verifyBuyer(payments, token);
    const paymentResults = await this.createPayment(token, verificationToken);

    this.displayPaymentResults('SUCCESS');
    console.debug('Payment Success', paymentResults);
  }

  async initializeCard(payments: any) {
    const card = await payments.card();
    await card.attach('#card-container');
    return card;
  }

  async handlePaymentMethodSubmission(event: Event, payments: any) {
    event.preventDefault();

    const cardButton = document.getElementById('card-button') as HTMLButtonElement | null;
    if (!cardButton) {
      console.error('Card button not found');
      return;
    }

    cardButton.disabled = true;

    let card: any; // Replace 'any' with the actual type of card from Square.js

    try {
      card = await this.initializeCard(payments);
      const token = await this.tokenize(card);
      const verificationToken = await this.verifyBuyer(payments, token);
      const paymentResults = await this.createPayment(token, verificationToken);

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

  async verifyBuyer(payments: any, token: any) {
    const verificationDetails = {
      amount: '1.00',
      billingContact: {
        givenName: 'John',
        familyName: 'Doe',
        email: 'john.doe@square.example',
        phone: '3214563987',
        addressLines: ['123 Main Street', 'Apartment 1'],
        city: 'London',
        state: 'LND',
        countryCode: 'GB',
      },
      currencyCode: 'GBP',
      intent: 'CHARGE',
    };

    const verificationResults = await payments.verifyBuyer(token, verificationDetails);
    return verificationResults.token;
  }

  async createPayment(token: any, verificationToken: any) {
    const body = {
      locationId: this.locationId,
      sourceId: token,
      verificationToken: verificationToken,
    };

    return this.http.post('/api/payment', body).toPromise();
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

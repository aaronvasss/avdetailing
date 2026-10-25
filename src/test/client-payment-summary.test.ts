import { describe, it, expect } from 'vitest';
import { bookingPaymentSummary } from '@/lib/booking-payment-summary';
describe('client payment summary', () => {
  it('shows the saved $145.18 for online bookings without adding 3.5%', () => expect(bookingPaymentSummary({ total_price: 145.18, payment_method: 'online', payment_status: 'unpaid' }).total).toBe(145.18));
  it('unpaid balance equals saved total', () => expect(bookingPaymentSummary({ total_price: 145.18, payment_method: 'in_person', payment_status: 'unpaid', deposit_amount: 0 }).balance).toBe(145.18));
  it('paid bookings have zero balance', () => expect(bookingPaymentSummary({ total_price: 362.8, payment_status: 'paid' }).balance).toBe(0));
  it('confirmed $100 deposit is deducted once', () => expect(bookingPaymentSummary({ total_price: 500, payment_status: 'deposit_paid', deposit_amount: 100 }).balance).toBe(400));
  it('unconfirmed deposit is not deducted', () => expect(bookingPaymentSummary({ total_price: 500, payment_status: 'unpaid', deposit_amount: 100 }).balance).toBe(500));
  it('zero deposit shows no deposit', () => expect(bookingPaymentSummary({ total_price: 145.18, payment_status: 'unpaid', deposit_amount: 0 }).deposit).toBe(0));
});

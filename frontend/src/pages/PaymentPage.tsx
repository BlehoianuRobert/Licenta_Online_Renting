import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { paymentService } from '../services/paymentService';
import { rentalService } from '../services/rentalService';
import { Rental } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/helpers';
import { STRIPE_PUBLISHABLE_KEY, ROUTES } from '../utils/constants';
import './PaymentPage.css';

// Initialize Stripe
const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Payment Form Component
const PaymentForm: React.FC<{ rentalId: number; amount: number; clientSecret: string }> = ({ 
  rentalId, 
  amount, 
  clientSecret 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError('Elementul de card nu este disponibil.');
      setIsProcessing(false);
      return;
    }

    try {
      // Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Eroare la procesarea plății.');
        setIsProcessing(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        const response = await paymentService.confirmPayment(paymentIntent.id);
        
        if (response.success) {
          setSuccess(true);
          setTimeout(() => {
            navigate(`${ROUTES.RENTAL_DETAIL.replace(':id', rentalId.toString())}`);
          }, 2000);
        } else {
          setError(response.message || 'Eroare la confirmarea plății.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'A apărut o eroare neașteptată.');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (success) {
    return (
      <div className="payment-success">
        <div className="success-icon">✓</div>
        <h2>Plata a fost procesată cu succes!</h2>
        <p>Veți fi redirecționat către detaliile rezervării...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <h3>Suma de plată</h3>
        <div className="amount-display">{formatCurrency(amount)}</div>
      </div>

      <div className="card-element-container">
        <label>Detalii card</label>
        <CardElement options={cardElementOptions} />
      </div>

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn btn-primary btn-large"
      >
        {isProcessing ? 'Se procesează...' : `Plătește ${formatCurrency(amount)}`}
      </button>
    </form>
  );
};

// Main Payment Page Component
const PaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [rental, setRental] = useState<Rental | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      initializePayment();
    }
  }, [id]);

  const initializePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load rental details
      const rentalData = await rentalService.getRentalById(Number(id));
      setRental(rentalData);

      // Get payment amount from query params or use total price
      const amountParam = searchParams.get('amount');
      const amount = amountParam ? parseFloat(amountParam) : rentalData.totalPrice;

      // Create payment intent
      const response = await paymentService.createPaymentIntent({
        rentalId: rentalData.id,
        amount: amount,
        currency: 'RON',
      });

      setClientSecret(response.clientSecret);
    } catch (err: any) {
      setError(err.message || 'Eroare la inițializarea plății.');
      console.error('Payment initialization error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="payment-page">
        <div className="container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error || !rental || !clientSecret) {
    return (
      <div className="payment-page">
        <div className="container">
          <div className="error-container">
            <h2>Eroare</h2>
            <p>{error || 'Nu s-a putut inițializa plata.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const amount = searchParams.get('amount') 
    ? parseFloat(searchParams.get('amount')!) 
    : rental.totalPrice;

  return (
    <div className="payment-page">
      <div className="container">
        <h1>Plată Rezervare</h1>
        
        <div className="payment-info">
          <h2>Detalii Rezervare</h2>
          <div className="info-row">
            <span>Produs:</span>
            <strong>{rental.inventoryUnit?.product?.name || 'N/A'}</strong>
          </div>
          <div className="info-row">
            <span>Perioadă:</span>
            <strong>
              {new Date(rental.startDate).toLocaleDateString('ro-RO')} - {new Date(rental.endDate).toLocaleDateString('ro-RO')}
            </strong>
          </div>
          <div className="info-row">
            <span>Suma totală:</span>
            <strong>{formatCurrency(rental.totalPrice)}</strong>
          </div>
        </div>

        <div className="payment-container">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm 
              rentalId={rental.id} 
              amount={amount} 
              clientSecret={clientSecret} 
            />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

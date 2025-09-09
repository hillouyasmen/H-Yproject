// src/pages/Checkout.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { notify } from '../components/Notifications.jsx';
import styles from '../styles/Checkout.module.css';

// PayPal
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import paypalConfig from '../config/paypalConfig';

const round2 = n =>
  Number((Math.round((Number(n) || 0) * 100) / 100).toFixed(2));

export default function Checkout() {
  const nav = useNavigate();
  const { state } = useLocation();

  const user_id = state?.uid ?? null;
  const cartItems = Array.isArray(state?.items) ? state.items : [];

  const [busy, setBusy] = useState(false);

  // server-verified quote
  const [quote, setQuote] = useState(null); // { items:[...], summary:{...}, plan, member_discount_percent }

  const isSandbox = useMemo(() => {
    const id = paypalConfig?.['client-id'] || '';
    return id === 'test' || id === 'sb' || id.startsWith('sb-');
  }, []);

  // fetch quote from server
  useEffect(() => {
    (async () => {
      if (!user_id || cartItems.length === 0) return;
      try {
        const { data } = await api.post('/payments/quote', {
          user_id,
          items: cartItems,
        });
        if (data?.ok) setQuote(data);
        else notify.error(data?.message || 'Could not get quote');
      } catch (e) {
        notify.error('Failed to get quote');
      }
    })();
  }, [user_id, cartItems]);

  const totalToPay = useMemo(
    () => round2(quote?.summary?.grand_total || 0),
    [quote],
  );

  const description = 'Cart checkout';

  const disabled = busy || !quote || totalToPay <= 0;

  return (
    <div className={styles.page}>
      <div className='container'>
        <div className={styles.wrap}>
          <section className={styles.left}>
            <h1 className={styles.title}>Checkout</h1>
            <div className={styles.sub}>
              Pay for your items securely with PayPal
            </div>

            {!user_id || cartItems.length === 0 ? (
              <div className={styles.note} style={{ marginTop: 12 }}>
                No items to checkout.
              </div>
            ) : (
              <div className={styles.cardForm} style={{ marginTop: 12 }}>
                <div className={styles.label}>Amount</div>
                <div className={styles.totalRow} style={{ marginBottom: 10 }}>
                  <span>{description}</span>
                  <b>${totalToPay.toFixed(2)}</b>
                </div>

                {isSandbox && (
                  <div className={styles.testBanner}>
                    Sandbox mode — PayPal is in test mode.
                  </div>
                )}

                <PayPalScriptProvider options={paypalConfig}>
                  <PayPalButtons
                    style={{
                      layout: 'vertical',
                      shape: 'rect',
                      label: 'paypal',
                    }}
                    forceReRender={[totalToPay, description]}
                    disabled={disabled}
                    createOrder={(data, actions) => {
                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [
                          {
                            description,
                            amount: { value: String(totalToPay) },
                          },
                        ],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      try {
                        setBusy(true);
                        const details = await actions.order.capture();
                        const captureId =
                          details?.purchase_units?.[0]?.payments?.captures?.[0]
                            ?.id;
                        const pid = captureId || data.orderID;

                        // tell server to CREATE the order (as PAID) now
                        const { data: fin } = await api.post(
                          '/payments/finalize',
                          {
                            user_id,
                            items: cartItems,
                            payment_id: pid,
                          },
                        );

                        if (fin?.ok && fin?.order_id) {
                          notify.success('Payment completed');
                          nav(`/thank-you?oid=${fin.order_id}`, {
                            replace: true,
                          });
                        } else {
                          notify.error(fin?.message || 'Finalize failed');
                        }
                      } catch (err) {
                        notify.error(
                          `PayPal approve error: ${err?.message || 'unknown'}`,
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                    onCancel={() => notify.info('Payment was cancelled')}
                    onError={err =>
                      notify.error(
                        `PayPal error: ${err?.message || 'unknown error'}`,
                      )
                    }
                  />
                </PayPalScriptProvider>

                <div className={styles.note} style={{ marginTop: 8 }}>
                  * Payments are processed via PayPal.
                </div>
              </div>
            )}
          </section>

          <aside className={styles.right}>
            <h3 className={styles.sectionHead}>Summary</h3>
            {!quote ? (
              <div className={styles.qty}>Loading…</div>
            ) : (
              <>
                <div className={styles.items}>
                  {quote.items.map((it, i) => (
                    <div key={i} className={styles.itemRow}>
                      <div>
                        <div className={styles.itemName}>{it.product_name}</div>
                        <div className={styles.badge}>
                          {it.color} • {it.size}
                        </div>
                      </div>
                      <div className={styles.qty}>x{it.quantity}</div>
                      <div className={styles.line}>
                        ${Number(it.line_total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.sumRow}>
                  <span>Subtotal</span>
                  <b>${Number(quote.summary.subtotal || 0).toFixed(2)}</b>
                </div>
                <div className={styles.sumRow}>
                  <span>Shipping</span>
                  <b>${Number(quote.summary.shipping || 0).toFixed(2)}</b>
                </div>
                <div className={styles.sumRow}>
                  <span>Tax</span>
                  <b>${Number(quote.summary.tax || 0).toFixed(2)}</b>
                </div>
                <div className={styles.totalRow}>
                  <span>Total</span>
                  <b>${Number(quote.summary.grand_total || 0).toFixed(2)}</b>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

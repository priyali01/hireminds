import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCreateRazorpayOrderMutation, useVerifyRazorpayPaymentMutation } from '../store/api'
import { useSelector } from 'react-redux'
import '../styles/dashboard.css'

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function PricingPage() {
  const [createOrder, { isLoading }] = useCreateRazorpayOrderMutation()
  const [verifyPayment] = useVerifyRazorpayPaymentMutation()
  const { user } = useSelector(state => state.auth)
  const navigate = useNavigate()

  const handleCheckout = async (plan) => {
    try {
      if (user?.plan === plan) {
        alert(`You are already subscribed to the ${plan} plan.`)
        return
      }

      // Load Razorpay JS
      const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?')
        return
      }

      // Create Order on Server
      const orderData = await createOrder({ plan }).unwrap()

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'HireMinds',
        description: `${plan.toUpperCase()} Plan Subscription`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            }).unwrap()

            alert('Payment Successful! Your plan has been upgraded.')
            if (plan === 'campus') {
              navigate('/tpo/dashboard')
            } else {
              navigate('/dashboard')
            }
          } catch (err) {
            alert('Verification failed: ' + (err.data?.error || 'Unknown error'))
          }
        },
        prefill: {
          name: user?.fullName,
          email: user?.email,
        },
        theme: {
          color: '#6366f1' // Indigo-500
        }
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
      
      paymentObject.on('payment.failed', function (response){
        alert('Payment Failed! Reason: ' + response.error.description)
      })

    } catch (err) {
      alert('Checkout Failed: ' + (err.data?.error || err.message))
    }
  }

  return (
    <div className="dashboard-page">


      <div className="dashboard-layout" style={{ maxWidth: '900px', textAlign: 'center' }}>
        <h1 className="welcome-title gradient-text">Supercharge Your Career</h1>
        <p className="welcome-subtitle">Unlock advanced AI mocks and higher usage quotas.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
          
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pro Plan</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>₹999<span style={{ fontSize: '1rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>/month</span></div>
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '1rem 0 2rem 0', flex: 1 }}>
              <li style={{ marginBottom: '0.5rem' }}>✅ Unlimited AI Mock Interviews</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Access to Advanced Resume Analytics</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Priority in Community Moderation Queue</li>
            </ul>
            <button 
              className="btn btn-primary" 
              onClick={() => handleCheckout('pro')} 
              disabled={isLoading || user?.plan === 'pro'}
            >
              {user?.plan === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            </button>
          </div>

          <div style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)', padding: '2rem', borderRadius: '1rem', color: 'white', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-12px', right: '2rem', background: '#f59e0b', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.875rem', fontWeight: 'bold' }}>For Colleges</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Campus Tier</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>₹9,999<span style={{ fontSize: '1rem', opacity: 0.8, fontWeight: 'normal' }}>/month</span></div>
            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: '1rem 0 2rem 0', flex: 1 }}>
              <li style={{ marginBottom: '0.5rem' }}>✅ Exclusive TPO Dashboard</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Track All Student Metrics</li>
              <li style={{ marginBottom: '0.5rem' }}>✅ Aggregate Readiness Analytics</li>
            </ul>
            <button 
              className="btn" 
              style={{ background: 'white', color: 'var(--color-primary)', fontWeight: '600' }}
              onClick={() => handleCheckout('campus')} 
              disabled={isLoading || user?.plan === 'campus'}
            >
              {user?.plan === 'campus' ? 'Current Plan' : 'Unlock Campus'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

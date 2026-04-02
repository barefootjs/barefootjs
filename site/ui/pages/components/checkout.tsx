/**
 * Checkout Reference Page (/components/checkout)
 */

import { CheckoutDemo } from '@/components/checkout-demo'
import {
  DocPage,
  PageHeader,
  Section,
  Example,
  type TocItem,
} from '../../components/shared/docs'

const tocItems: TocItem[] = [
  { id: 'preview', title: 'Preview' },
  { id: 'features', title: 'Features' },
]

const previewCode = `"use client"

import { createSignal, createMemo } from '@barefootjs/dom'

function Checkout() {
  const [step, setStep] = createSignal(1)
  const [name, setName] = createSignal('')
  const [paymentMethod, setPaymentMethod] = createSignal('credit-card')

  const shippingValid = createMemo(() => name().length > 0 && ...)
  const total = createMemo(() => subtotal() + shippingCost() + tax())

  return (
    <div>
      {step() === 1 ? (
        <ShippingForm />
      ) : step() === 2 ? (
        <PaymentForm />
      ) : (
        <ReviewOrder items={items()} total={total()} />
      )}
    </div>
  )
}`

export function CheckoutRefPage() {
  return (
    <DocPage slug="checkout" toc={tocItems}>
      <PageHeader
        title="Checkout"
        description="A multi-step checkout flow with shipping address, payment method selection, and order review. Demonstrates composite loops inside conditionals, controlled RadioGroup/Select, and derived validation."
      />

      <Section id="preview" title="Preview">
        <Example code={previewCode}>
          <CheckoutDemo />
        </Example>
      </Section>

      <Section id="features" title="Features">
        <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
          <li><strong>Multi-step flow:</strong> 3-step wizard (Shipping → Payment → Review) via nested ternary</li>
          <li><strong>Form validation:</strong> Per-step validation memos disable the Continue button until all fields are valid</li>
          <li><strong>Controlled Select:</strong> Country picker with signal binding</li>
          <li><strong>Controlled RadioGroup:</strong> Shipping method and payment method selection</li>
          <li><strong>Conditional card form:</strong> Credit card fields appear/hide based on payment method</li>
          <li><strong>Composite loop in conditional:</strong> Order items with Badge components inside the review step (#724)</li>
          <li><strong>Derived pricing chain:</strong> subtotal → shipping → tax → total via chained createMemo</li>
          <li><strong>Cross-step state:</strong> Form data persists when navigating between steps</li>
        </ul>
      </Section>
    </DocPage>
  )
}

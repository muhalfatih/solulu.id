"use client"

import * as React from "react"
import {
  PublicAccordion,
  PublicAccordionItem,
  PublicAccordionTrigger,
  PublicAccordionContent,
} from "@/components/public/public-accordion"

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  faqs: FaqItem[]
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <PublicAccordion type="single" collapsible className="flex flex-col gap-3.5 w-full">
      {faqs.map((faq, idx) => (
        <PublicAccordionItem key={idx} value={`item-${idx}`}>
          <PublicAccordionTrigger id={`faq-trigger-${idx}`}>{faq.question}</PublicAccordionTrigger>
          <PublicAccordionContent id={`faq-content-${idx}`}>{faq.answer}</PublicAccordionContent>
        </PublicAccordionItem>
      ))}
    </PublicAccordion>
  )
}

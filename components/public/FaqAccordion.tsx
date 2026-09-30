"use client"

import * as React from "react"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  faqs: FaqItem[]
}

export function FaqAccordion({ faqs }: FaqAccordionProps) {
  return (
    <Accordion type="single" collapsible className="flex flex-col gap-3.5 w-full">
      {faqs.map((faq, idx) => (
        <AccordionItem key={idx} value={`item-${idx}`}>
          <AccordionTrigger id={`faq-trigger-${idx}`}>{faq.question}</AccordionTrigger>
          <AccordionContent id={`faq-content-${idx}`}>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

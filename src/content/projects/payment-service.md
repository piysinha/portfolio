---
title: Stripe payment service
summary: A Spring Boot service that creates Stripe payment links for orders. The gateway sits behind an interface, so another payment provider can be swapped in.
area: Backend
tags: [Java, Spring Boot, Stripe, REST APIs]
repo: https://github.com/piysinha/PaymentService
date: 2024-08-18
---

The payment service in a small microservices backend, built during Scaler's backend course.

## What it does

- Creates a Stripe payment link for an order, which sends the customer to a configured page once they've paid.
- A webhook endpoint checks the signature on every Stripe event, rejecting forged or replayed ones, and logs completed payments.

## How it's built

- A `PaymentGateway` interface with a Stripe implementation, so the rest of the service doesn't depend on Stripe directly.
- The Stripe secret key, the webhook signing secret and the redirect page come from environment variables, never from the code.

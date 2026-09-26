---
title: Product catalogue service
summary: Product and category APIs in Spring Boot over MySQL, with Redis caching for an external product source and support for tokens issued by the user service.
area: Backend
tags: [Java, Spring Boot, Redis, MySQL, Flyway]
repo: https://github.com/piysinha/ProductService
date: 2024-08-18
---

The catalogue service in a small microservices backend, built during Scaler's backend course alongside the [user and auth service](/projects/user-service) and the [Stripe payment service](/projects/payment-service).

## What it does

- REST APIs to list (with pagination), read, create, update and delete products, plus categories, with a controller advice that turns errors into consistent responses.
- Two implementations behind one `ProductService` interface: one stores products in MySQL, the other reads them from an external store API and caches them in Redis.
- Set up as an OAuth2 resource server for JWTs issued by the user service, with roles read from the token's claims.

## How it's built

- Spring Data JPA over MySQL, with Flyway managing the schema.
- Database, port and token issuer all come from environment variables.

---
title: User and auth service
summary: A Spring Boot service for sign-up, login and token validation, with BCrypt-hashed passwords and a session record for every token it issues.
area: Backend
tags: [Java, Spring Boot, Spring Security, JWT, MySQL]
repo: https://github.com/piysinha/UserService
date: 2024-07-27
---

The authentication service in a small microservices backend, built during Scaler's backend course. The [product catalogue service](/projects/product-service) is set up to accept the tokens it issues.

## What it does

- **Sign-up** stores the password as a BCrypt hash and rejects an email that's already registered.
- **Login** checks the password, issues a JWT and records an active session for it.
- **Validate** lets other services confirm that a token belongs to an active session.

## How it's built

- Controllers, services and repositories are kept separate, with DTOs at the API boundary and custom exceptions for each failure.
- Spring Security with Spring Authorization Server, storing OAuth2 clients and authorizations in MySQL through JPA.
- Database settings come from environment variables.

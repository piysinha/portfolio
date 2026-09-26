---
title: User and auth service
summary: A Spring Boot service for sign-up, login, logout and token validation, with BCrypt-hashed passwords, signed tokens that expire, and a session record for every token it issues.
area: Backend
tags: [Java, Spring Boot, Spring Security, JWT, MySQL]
repo: https://github.com/piysinha/UserService
date: 2024-07-27
---

The authentication service in a small microservices backend, built during Scaler's backend course. The [product catalogue service](/projects/product-service) is set up to accept the OAuth2 access tokens from its authorization server.

## What it does

- **Sign-up** stores the password as a BCrypt hash and rejects an email that's already registered.
- **Login** checks the password, issues a signed JWT that expires after 24 hours, and records an active session for it. The token carries the user's id and email, never the password hash.
- **Logout** ends the session, so its token stops validating.
- **Validate** lets other services confirm that a token is genuine, hasn't expired and belongs to an active session.

## How it's built

- Controllers, services and repositories are kept separate, with DTOs at the API boundary and custom exceptions for each failure.
- Spring Security with Spring Authorization Server, storing OAuth2 clients and authorizations in MySQL through JPA.
- Database settings and the token signing key come from environment variables.

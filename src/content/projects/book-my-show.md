---
title: Movie ticket booking
summary: A low-level design of seat booking for cinema shows. Seats are checked and held inside one serializable transaction, so two people can't book the same seat.
area: Backend
tags: [Java, Spring Boot, Low-level design, JPA]
repo: https://github.com/piysinha/BookMyShow
date: 2024-04-20
---

A low-level design exercise from Scaler's backend course, modelled on BookMyShow.

## How it's built

- Booking runs in a serializable transaction: it checks that every requested seat is free, blocks the seats and creates a pending booking in one step.
- Prices come from a separate price calculator, based on each seat's type for that show.
- A model of regions, theatres, screens, seats, shows and payments.

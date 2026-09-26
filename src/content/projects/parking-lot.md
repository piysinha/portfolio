---
title: Parking lot ticketing
summary: A low-level design of a parking lot that issues tickets at entry gates, with swappable strategies for picking a slot and for working out the fee.
area: Backend
tags: [Java, Spring Boot, Low-level design, Design patterns]
repo: https://github.com/piysinha/ParkingLot
date: 2024-04-16
---

A low-level design exercise from Scaler's backend course.

## How it's built

- **Slot allocation strategies**: nearest, farthest or random, chosen through a factory.
- **Fee strategies**: by the hour or by vehicle type.
- A model of lots, floors, slots, gates and operators, each with its own status.
- Controllers, services and repositories kept separate, with request and response DTOs.

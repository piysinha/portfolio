---
title: Expense splitter
summary: A low-level design of group expense sharing. Its settle-up step works out who should pay whom, using two priority queues to pair the biggest creditors with the biggest debtors.
area: Backend
tags: [Java, Spring Boot, Low-level design, Design patterns]
repo: https://github.com/piysinha/SplitWise
date: 2024-04-20
---

A low-level design exercise from Scaler's backend course, modelled on Splitwise.

## How it's built

- **Command pattern.** Each console command (register, settle up a user, settle up a group) is its own class, run by a command executor.
- **Strategy pattern.** Settling up is a `SettleUpStrategy`, so the algorithm can change without touching the rest of the code. The heap-based strategy nets each person's balance, then keeps pairing the largest amount owed with the largest amount due until every balance is settled.
- Expenses record who paid and who owes, and completed settlements are recorded as reverse expenses, so history is never rewritten.

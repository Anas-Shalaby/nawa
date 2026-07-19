# Nawah Workflows

> Version 1.0
> Last Updated: July 2026

---

# Purpose

This document defines how people actually use Nawah.

It is the single source of truth for every workflow inside the product.

**Database tables never define workflows.**

**Workflows define the product.**

Whenever a new feature is proposed, it must fit inside one of the workflows below.

If it doesn't...

the feature should be redesigned.

---

# Users

Nawah currently serves five primary user types.

- Patient
- Receptionist
- Doctor
- Clinic Owner
- Accountant

Each role has different goals.

Therefore each role should experience a different product.

---

# Workflow 01

# Patient Journey

Goal:

Book an appointment with the least possible effort.

---

Patient

↓

Open Booking Link

↓

View Clinic Profile

↓

Choose Service

↓

Choose Doctor (optional)

↓

Choose Date & Time

↓

Enter Information

↓

Confirm Booking

↓

Receive Booking Confirmation

↓

Receive QR Code

↓

Visit Clinic

---

Success Criteria

- Booking completed in less than one minute.
- No account required.
- Mobile-first experience.
- Minimal typing.

---

# Workflow 02

# Receptionist Journey

Goal:

Move patients smoothly from booking to consultation.

---

Receptionist

↓

Open Today

↓

See New Bookings

↓

Confirm Booking (if required)

↓

Handle Walk-in

↓

Patient Arrives

↓

Check In

↓

Move to Waiting Queue

↓

Collect Payment (optional)

↓

Next Patient

---

Primary Screen

Today

---

Secondary Screens

Patients

Schedule

---

Never Needed

Analytics

Inventory

Reports

---

# Workflow 03

# Doctor Journey

Goal:

Treat patients without thinking about the software.

---

Doctor

↓

Login

↓

Today

↓

Current Patient

↓

Start Visit

↓

Patient Workspace

↓

Consultation

↓

Prescription

↓

Media (optional)

↓

Follow-up

↓

Finish Visit

↓

Next Patient

↓

Repeat

---

Primary Screen

Today

---

Secondary Screen

Patient Workspace

---

Doctor should spend more than 90% of the day inside these two screens only.

---

# Patient Workspace

This is the heart of Nawah.

Every visit happens here.

Layout

↓

Patient Summary

↓

Today's Visit

↓

Prescription

↓

Medical Images

↓

Timeline

↓

Billing

↓

Finish Visit

---

Rules

No tabs.

No unnecessary navigation.

Everything needed for today's visit exists on one page.

---

# Workflow 04

# Owner Journey

Goal:

Understand and improve clinic performance.

---

Owner

↓

Today

↓

Business

↓

Team

↓

Settings

---

Owner rarely opens Patient Workspace.

Owner makes operational decisions.

---

# Workflow 05

# Accountant Journey

Goal:

Maintain accurate financial records.

---

Business

↓

Payments

↓

Outstanding Balances

↓

Reports

---

Accountants should never see clinical information they don't need.

---

# Workflow 06

# Team Management

Goal:

Build and manage the clinic staff.

---

Owner

↓

Open Team

↓

Invite Member

↓

Invitation Accepted

↓

Assign Role

↓

Customize Permissions

↓

Ready

---

Every team member should immediately receive the correct interface based on permissions.

---

# Workflow 07

# Daily Clinic Operation

Clinic Opens

↓

Reception Starts Check-in

↓

Patients Enter Waiting

↓

Doctor Calls Patient

↓

Consultation

↓

Payment

↓

Follow-up

↓

Patient Leaves

↓

Next Patient

↓

Clinic Closes

---

This workflow represents the heartbeat of Nawah.

Every feature should support this loop.

---

# Screen Responsibilities

## Today

Question

What should I do now?

---

## Patients

Question

Which patient am I working with?

---

## Patient Workspace

Question

How do I finish this visit?

---

## Schedule

Question

What does my day look like?

---

## Business

Question

How is my clinic performing?

---

## Team

Question

Who works with me?

---

## Settings

Question

What should I configure?

---

# Workflow Rules

## Rule 1

Every workflow ends with a clear action.

Examples

Finish Visit

Complete Payment

Invite Member

Confirm Booking

Never generic "Save".

---

## Rule 2

Critical workflows should never exceed three screens.

---

## Rule 3

Navigation should disappear.

Users should think about patients.

Not software.

---

## Rule 4

Every page must have exactly one primary action.

---

## Rule 5

Never interrupt a workflow with unnecessary dialogs.

---

## Rule 6

Real-time updates should remove the need for refreshing.

---

## Rule 7

Interfaces should adapt automatically to user roles.

---

## Rule 8

The software guides the user.

The user never searches for the next step.

---

# Future Workflows

These workflows are planned.

- AI Assistant
- Marketing
- Multi-Branch Operations
- Online Payments
- Smart Follow-ups
- Smart Inventory
- Insurance Claims

These workflows should follow the same principles before implementation.

---

# Workflow Validation Checklist

Before implementing any feature ask:

✓ Which workflow does it belong to?

✓ Which user needs it?

✓ Does it simplify the workflow?

✓ Does it reduce clicks?

✓ Does it reduce thinking?

✓ Does it reduce navigation?

If any answer is "No",

the feature should be redesigned.

---

# Final Principle

People don't buy clinic software.

People buy calmer workdays.

Every workflow inside Nawah should make the clinic feel quieter, faster, and easier to operate.

If a workflow creates confusion...

it does not belong in Nawah.

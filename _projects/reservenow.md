---
layout: project
name: Reserve Now
tools: [Swift, XCode, iOS, SQL]
image: /assets/image/projects/reserve-now.png
description: Native iOS restaurant reservation app (Swift) with dual customer and staff interfaces.
category: iOS App
status: "2022"
tags: [Student Work]
external_links:
  - { name: "Source", url: "https://github.com/Nuo27/reserve_now", icon: "github", prefix: "fab" }
---

**Reserve Now** is a native iOS application developed for UTS iOS App Development. It provides a streamlined reservation platform with separate interfaces for customers — who can browse, book, modify, and cancel reservations — and staff — who manage and track all incoming bookings through a dedicated dashboard.

## Role

Solo Developer

## Contributions

- Built the complete application end-to-end in Swift using Xcode
- Designed and implemented dual-role interface system (customer / staff workflows)
- Integrated a SQL database for persistent reservation management
- Used CocoaPods for dependency management

## Technical Challenges

- Structured the customer and staff apps as two thin front-end layers over a shared model and data-access layer, so reservations, user records, and validation logic lived in one place and both flows stayed consistent.
- Modeled the SQL schema around a few core tables — restaurants, time slots, reservations, and users — with foreign keys tying slots to restaurants and reservations to slots, which made booking and cancellation queries straightforward.
- Working in iOS sharpened discipline around state management and async UI updates, lessons that mapped directly onto game UI work later, where the same care with view state and threading prevents flicker and stale data.

## Lessons Learned

- Took on too much as a solo developer at first; would scope a smaller v1 with just customer booking next time and add the staff dashboard once that was solid.
- The cross-domain experience between iOS and Unity showed that good architecture looks similar regardless of platform — clear data flow, single source of truth, and minimal coupling between UI and logic.

---

Source: [GitHub](https://github.com/Nuo27/reserve_now)

{% capture carousel_images %}
/assets/image/projects/reserve-now-1.png
/assets/image/projects/reserve-now-2.png
/assets/image/projects/reserve-now-3.png
{% endcapture %}
{% include elements/carousel.html %}

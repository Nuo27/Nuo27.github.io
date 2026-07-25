---
layout: project
name: Reserve Now
tags: [Swift, XCode, iOS, SQL, Student Work]
image: /assets/image/projects/reserve-now.png
description: Native iOS restaurant reservation app (Swift) with dual customer and staff interfaces.
category: iOS App
status: "2022"
external_links:
  - { name: "Source", url: "https://github.com/Nuo27/reserve_now", icon: "github", prefix: "fab" }
---

**Reserve Now** is a native iOS application developed for UTS iOS App Development. It provides a streamlined reservation platform with separate interfaces for customers - who can browse, book, modify, and cancel reservations - and staff - who manage and track all incoming bookings through a dedicated dashboard.

## Role

Solo Developer

## Contributions

- Built the complete application end-to-end in Swift using Xcode
- Designed and implemented dual-role interface system (customer / staff workflows)
- Integrated a SQL database for persistent reservation management
- Used CocoaPods for dependency management

## Technical Challenges

- **Talked to MySQL directly from iOS via OHMySQL.** Rather than stand up a backend API for a three-week assignment, I wrapped the OHMySQL Objective-C library (through CocoaPods) in a Swift `Database` class managing the `MySQLStoreCoordinator` and `MySQLQueryContext`, executing INSERT/SELECT requests and decoding the returned row dictionaries. The tradeoff was latency - the free db4free host sat in Austria, ~260-300ms per call - so I kept a backup-database config swappable in the same class.
- **Typed model with manual row decoding.** `Customer` held its fields private behind getters/setters, and DB result rows (`[String: Any]`) were decoded into typed objects via conditional casts (`row["partysize"] as? Int`), so the rest of the app worked against real types rather than raw dictionaries.
- **MVC layering that survived a mid-project pivot.** Customer and staff screens were thin controllers over a shared `Database` + `Customer` model; when I rewrote local-only booking logic into live database calls in iteration 3, the controllers barely changed - only the data layer did.
- **Validation and business rules at the edges.** Null and format checks ran before any insert, and party size auto-adjusted to remaining availability but hard-capped at 10, so a booking could never exceed a slot's capacity.

## Lessons Learned

- Took on too much as a solo developer at first; would scope a smaller v1 with just customer booking next time and add the staff dashboard once that was solid.
- The cross-domain experience between iOS and Unity showed that good architecture looks similar regardless of platform - clear data flow, single source of truth, and minimal coupling between UI and logic.

---

Source: [GitHub](https://github.com/Nuo27/reserve_now)

{% capture carousel_images %}
/assets/image/projects/reserve-now-1.png
/assets/image/projects/reserve-now-2.png
/assets/image/projects/reserve-now-3.png
{% endcapture %}
{% include elements/carousel.html %}

---
layout: project
name: Reserve Now
tags: [Swift, XCode, iOS, SQL, Student Work]
image: /assets/image/projects/reserve-now.png
description: Native iOS restaurant reservation app (Swift) with dual customer and staff interfaces.
category: iOS App
status: "2022"
external_links:
  - {
      name: "Source",
      url: "https://github.com/Nuo27/reserve_now",
      icon: "github",
      prefix: "fab",
    }
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

- **Talking to MySQL directly from iOS.** Rather than stand up a backend for a three-week assignment, the iOS app drove a remote MySQL host through a third-party client library wrapped in Swift, executing queries and decoding returned row dictionaries. The tradeoff was latency — the free host sat in another continent, ~260-300ms per call — so the same layer kept a backup database config swappable.
- **Typed model with manual row decoding.** Result rows decoded into typed domain objects through conditional casts, so the rest of the app worked against real types rather than raw dictionaries.
- **MVC layering that survived a mid-project pivot.** Customer and staff screens were thin controllers over a shared model + database layer; when local-only booking logic was rewritten into live database calls in iteration 3, the controllers barely changed — only the data layer did.
- **Validation and business rules at the edges.** Null and format checks ran before any insert; party-size validation auto-adjusted to remaining availability with a hard cap so a booking could never exceed a slot's capacity.

## Lessons Learned

- Over-relied on direct database operations from the start. CocoaPods and oh-my-sql were adopted after testing alternatives, and integrating them late — paired with database configuration and version compatibility challenges — caused delays that should have been caught earlier.

- Originally scoped as a team project, ended up solo after teammates stopped responding / working. Picked up all the work rather than letting the project stall — compressed the timeline but sharpened end-to-end ownership of the codebase, with every screen, query, and edge case passing through one pair of hands.

---

Source: [GitHub](https://github.com/Nuo27/reserve_now)

{% capture carousel_images %}
/assets/image/projects/reserve-now-1.png
/assets/image/projects/reserve-now-2.png
/assets/image/projects/reserve-now-3.png
{% endcapture %}
{% include elements/carousel.html %}

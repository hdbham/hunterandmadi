# Guest Confusion — RSVP Form Audit

Thinking through the form as someone who just received an invitation and has no inside knowledge.

---

## 1. Phone has no required indicator (`*`)

**Where:** Guest card, Phone field  
**Problem:** Name has `*`, Email has `*` (for Guest 1), but Phone has no asterisk. We made it required in validation but the label doesn't say so. Guest submits, field goes red, they're confused why.  
**Fix:** Add `<span class="required">*</span>` to the Phone label for all guests.

---

## 2. "One entry per person" is ambiguous

**Where:** Step 2 header  
**Problem:** Does this mean "each person in your family should submit their own form separately" or "fill out one card per person in your group"? Both interpretations are reasonable. Most people assume wedding RSVPs cover a whole party.  
**Fix:** Change to something like: "Fill out one card per person in your party — including yourself."

---

## 3. "Guest 1" vs "You" — the first card is for the submitter

**Where:** Step 2, first attendee card header  
**Problem:** "Guest 1" implies a guest of the submitter. But Guest 1 is actually the person filling the form. Email and phone are collected here as the contact info. It's disorienting.  
**Fix:** Label the first card "You" or "Guest 1 (you)" instead of "Guest 1."

---

## 4. Sleeping preference shown to Day Guests

**Where:** Step 2, sleeping preference radio group  
**Problem:** If someone picks "The Day Guest — Attending the wedding festivities on Saturday only," they still see a sleeping preference question. A day guest doesn't need a bed. This is confusing and may make them feel like they're expected to stay overnight.  
**Fix:** Hide the sleeping preference section when "The Day Guest" itinerary option is selected (via JS event listener on arrival radios).

---

## 5. Weekend itinerary options imply labor

**Where:** Step 2, "Select your weekend itinerary"  
**Problem:** "The Setup Crew" and "The Full Weekend" both say things like "help prep" and "help out." A guest who didn't know they were expected to help will be startled. Some guests may not want to commit to helping but still want to stay Friday.  
**Fix:** Soften the language — e.g., "Arriving Friday night, staying through Sunday morning" — and reserve "helping" framing for a separate volunteer opt-in, or make it clear helping is optional/welcome but not required.

---

## 6. "The Saturday Guest" implies mandatory overnight

**Where:** Step 2, itinerary option  
**Problem:** "Arriving by 2:00 PM Saturday to settle in and staying overnight" — what if someone wants to come Saturday but go home that night? There's no "Saturday day only, leaving same night" option. "The Day Guest" says "Saturday only" but that reads like no overnight, and it's ambiguous whether it includes the reception.  
**Fix:** Clarify whether Day Guest = no overnight. Consider adding a note like "No overnight stay" next to The Day Guest, and "Includes overnight stay" next to Saturday Guest.

---

## 7. No RSVP deadline anywhere on the form

**Where:** All steps  
**Problem:** Guests have no idea when they need to respond by. Someone might think "I'll come back to this later" and forget.  
**Fix:** Add a deadline line near the top of the form — e.g., "Please RSVP by [date]."

---

## 8. "Ask us for photos" — ask who, how?

**Where:** Step 2, sleeping preference — cabin bunk option  
**Problem:** "Cabin bunk (shared half bath; ask us for photos)" — there's no contact info on this page, no link, no indication of how to ask. A guest on mobile will be confused.  
**Fix:** Link to an email address or the FAQ page, or just include a photo/link inline.

---

## 9. "Not sure yet" sleeping option has no follow-up path

**Where:** Step 2, sleeping preference  
**Problem:** If someone picks "Not sure yet," will they be contacted again? Is there a deadline? Will they lose their spot? This creates anxiety.  
**Fix:** Add a small help text like "We'll follow up closer to the date."

---

## 10. Step indicator is invisible on step 1

**Where:** Form progress dots  
**Problem:** The `stepIndicator` div has `display: none` on step 1. Guests don't know there are more steps until they click Next and suddenly a dot indicator appears. They have no sense of how long this will take.  
**Fix:** Show the step indicator from step 1, or add a simple "Step 1 of 3" text label visible from the start.

---

## 11. Bug: removed guests relabeled "Attendee" instead of "Guest"

**Where:** `removeAttendee()` function in index.html  
**Problem:** When an attendee card is removed and cards reindex, the JS sets the label to `Attendee ${newIndex + 1}` but the create function uses `Guest ${index + 1}`. After a removal, remaining cards switch from "Guest" to "Attendee."  
**Fix:** Change the reindex label in `removeAttendee()` to match: `Guest ${newIndex + 1}`.

---

## Summary Table

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | Phone missing `*` required indicator | Low | Trivial |
| 2 | "One entry per person" ambiguous | Medium | Trivial |
| 3 | "Guest 1" should be "You" | Medium | Trivial |
| 4 | Sleeping shown to Day Guests | High | Small |
| 5 | Itinerary implies mandatory labor | Medium | Small |
| 6 | Saturday Guest overnight ambiguity | Medium | Trivial |
| 7 | No RSVP deadline on form | High | Trivial |
| 8 | "Ask us for photos" has no contact path | Low | Trivial |
| 9 | "Not sure yet" has no follow-up signal | Low | Trivial |
| 10 | Step indicator hidden on step 1 | Low | Small |
| 11 | Bug: guests relabeled "Attendee" on reindex | Medium | Trivial |

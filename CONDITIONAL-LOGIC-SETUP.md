# Conditional Logic Setup Guide for Google Forms

## Overview
The form includes conditional questions that show/hide based on previous answers. Google Forms uses "Go to section based on answer" for conditional logic.

## Conditional Questions to Set Up

### 1. Overnight Stay Questions
**Trigger Question:** "Will you be staying overnight?"
- **If "Yes, I'm staying overnight"** → Show these questions:
  - Who will be staying overnight?
  - Are you planning to arrive on Friday evening or Saturday morning?
  - What is your preferred sleeping arrangement?
  - Emergency contact
  - Would you like a suggested packing list sent to you?

- **If "No, I'm not staying overnight"** → Skip to "Ceremony & Guests" section

**How to set up:**
1. Click on the "Will you be staying overnight?" question
2. Click the three dots (⋮) → "Go to section based on answer"
3. For "Yes, I'm staying overnight" → Go to next section (Weekend Plans)
4. For "No, I'm not staying overnight" → Go to "Ceremony & Guests" section

### 2. Additional Guests Question
**Trigger Question:** "Are you bringing any additional guests?"
- **If "Yes"** → Show: "If bringing additional guests, please list their names"
- **If "No"** → Skip to next question

**How to set up:**
1. Click on "Are you bringing any additional guests?"
2. Click the three dots (⋮) → "Go to section based on answer"
3. For "Yes" → Go to next question (guest names)
4. For "No" → Skip to "Meals" section

### 3. Dietary Restrictions Question
**Trigger Question:** "Will you be eating both nights?"
- **If "Feed me only dinner please!" or "Help feed me"** → Show: "Any dietary restrictions or allergies?"
- **If "I'll feed myself"** → Skip dietary restrictions question

**How to set up:**
1. Click on "Will you be eating both nights?"
2. Click the three dots (⋮) → "Go to section based on answer"
3. For "Feed me only dinner please!" → Go to next question (dietary restrictions)
4. For "Help feed me" → Go to next question (dietary restrictions)
5. For "I'll feed myself" → Skip to "Additional Information" section

## Alternative: Using Sections

You can also organize conditional questions into separate sections:

1. **Section 1:** Basic Information (always shown)
2. **Section 2:** Weekend Plans - Overnight Guests (conditional)
3. **Section 3:** Weekend Plans - Day Guests (conditional)
4. **Section 4:** Ceremony & Guests (always shown)
5. **Section 5:** Meals (always shown)
6. **Section 6:** Additional Information (conditional)

## Quick Setup Steps

1. Create the form using the Google Apps Script
2. Open the form in Google Forms editor
3. For each conditional question:
   - Click the question
   - Click the three dots (⋮)
   - Select "Go to section based on answer"
   - Set up the routing for each answer option
4. Test the form to ensure conditional logic works correctly

## Testing Checklist

- [ ] Select "No" for overnight stay → Should skip overnight questions
- [ ] Select "Yes" for overnight stay → Should show all overnight questions
- [ ] Select "No" for additional guests → Should skip guest names question
- [ ] Select "Yes" for additional guests → Should show guest names question
- [ ] Select "I'll feed myself" → Should skip dietary restrictions
- [ ] Select "Feed me only dinner" → Should show dietary restrictions
- [ ] Select "Help feed me" → Should show dietary restrictions


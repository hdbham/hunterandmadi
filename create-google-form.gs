/**
 * Google Apps Script to create a Google Form from JSON structure
 * 
 * Instructions:
 * 1. Open Google Drive
 * 2. Create a new Google Apps Script project (Extensions > Apps Script)
 * 3. Paste this code
 * 4. Copy the JSON structure from rsvp-form-structure.json
 * 5. Replace the formData variable with your JSON
 * 6. Run the createFormFromJSON() function
 * 7. The form will be created in your Google Drive
 */

function createFormFromJSON() {
  // Paste your JSON structure here (from rsvp-form-structure.json)
  const formData = {
    "formTitle": "Weekend Interest Form",
    "formDescription": "Where: YMCA Mill Hollow: 7480 South Mill Hollow Road, Kamas, UT 84036\nWhen: Sept 18th - 20th, 2026\nContact: For questions message Madi at 801-458-2972 or email us at hunterandmadi9496@gmail.com\n\nPlease submit by July 1, 2026",
    "sections": [
      {
        "sectionTitle": "Basic Information",
        "questions": [
          {
            "title": "First and Last name(s)",
            "type": "short_answer",
            "required": true,
            "description": "Please list all names of people attending"
          },
          {
            "title": "Email address",
            "type": "short_answer",
            "required": true,
            "description": "We'll use this to send you the packing list and updates"
          },
          {
            "title": "Phone number",
            "type": "short_answer",
            "required": false,
            "description": "Optional - for urgent updates, especially with limited cell service"
          }
        ]
      },
      {
        "sectionTitle": "Weekend Plans",
        "questions": [
          {
            "title": "Who will be staying overnight? Please list everyone!",
            "type": "paragraph",
            "required": true,
            "description": "List all names of people staying overnight"
          },
          {
            "title": "Are you planning to arrive on Friday evening or Saturday morning?",
            "type": "multiple_choice",
            "required": true,
            "description": "*** Please don't arrive any later than noon on Saturday morning so you have time to settle in! ***",
            "options": [
              "Friday evening",
              "Saturday morning"
            ]
          },
          {
            "title": "What is your preferred sleeping arrangement?",
            "type": "multiple_choice",
            "required": true,
            "options": [
              "Bunkin' it! In a cabin bunk please (We'll have a Friend Bunk and a Family Bunk ready for overnighters!) These cabins have 12 beds with a shared half bath. Reach out if you'd like more pictures!",
              "Roughin it! I'll bring my own tent or stay nearby for the weekend (please feed me!)"
            ]
          },
          {
            "title": "Emergency contact",
            "type": "short_answer",
            "required": false,
            "description": "Name and phone number of emergency contact (for overnight guests)"
          }
        ]
      },
      {
        "sectionTitle": "Ceremony & Guests",
        "questions": [
          {
            "title": "Will you be attending the ceremony on Saturday, September 19th at 4:30 PM?",
            "type": "multiple_choice",
            "required": true,
            "options": [
              "Yes",
              "No"
            ]
          },
          {
            "title": "Are you bringing any additional guests?",
            "type": "multiple_choice",
            "required": false,
            "description": "If yes, please list their names in the next question",
            "options": [
              "Yes",
              "No"
            ]
          },
          {
            "title": "If bringing additional guests, please list their names",
            "type": "paragraph",
            "required": false,
            "description": "Only answer if you selected 'Yes' above"
          }
        ]
      },
      {
        "sectionTitle": "Meals",
        "questions": [
          {
            "title": "Will you be eating both nights?",
            "type": "multiple_choice",
            "required": true,
            "description": "(we will reach out about dietary restrictions)\n\n** Dinner will be provided Fri and Saturday, we ask that people help pitch for the cost of OR bring their own lunches and snacks (full shared kitchen in Main Lodge, fridge space may be limited) **",
            "options": [
              "Feed me only dinner please!",
              "I'll feed myself",
              "Help feed me: I will help procure these goods (any donation helps!)"
            ]
          },
          {
            "title": "Any dietary restrictions or allergies we should know about?",
            "type": "paragraph",
            "required": false,
            "description": "Please list any dietary restrictions, allergies, or special dietary needs"
          }
        ]
      },
      {
        "sectionTitle": "Additional Information",
        "questions": [
          {
            "title": "Would you like a suggested packing list sent to you?",
            "type": "multiple_choice",
            "required": true,
            "options": [
              "Yes",
              "No thanks, I got it!"
            ]
          },
          {
            "title": "Song requests (optional)",
            "type": "paragraph",
            "required": false,
            "description": "Any songs you'd love to hear at the reception?"
          },
          {
            "title": "Comments, questions, or well wishes",
            "type": "paragraph",
            "required": false,
            "description": "Anything else you'd like us to know?"
          }
        ]
      }
    ]
  };

  // Create the form
  const form = FormApp.create(formData.formTitle);
  form.setDescription(formData.formDescription);
  form.setConfirmationMessage("Thank you for your RSVP! We can't wait to celebrate with you!");
  form.setShowLinkToRespondAgain(false);
  form.setAllowResponseEdits(true);
  form.setLimitOneResponsePerUser(false);

  // Add questions
  formData.sections.forEach((section, sectionIndex) => {
    // Add section header (as a title question)
    if (sectionIndex > 0) {
      const sectionTitle = form.addSectionHeaderItem();
      sectionTitle.setTitle(section.sectionTitle);
    }

    section.questions.forEach((questionData) => {
      let item;

      switch (questionData.type) {
        case "short_answer":
          item = form.addTextItem();
          break;
        case "paragraph":
          item = form.addParagraphTextItem();
          break;
        case "multiple_choice":
          item = form.addMultipleChoiceItem();
          if (questionData.options) {
            const choices = questionData.options.map(opt => item.createChoice(opt));
            item.setChoices(choices);
          }
          break;
        case "checkbox":
          item = form.addCheckboxItem();
          if (questionData.options) {
            const choices = questionData.options.map(opt => item.createChoice(opt));
            item.setChoices(choices);
          }
          break;
        default:
          item = form.addTextItem();
      }

      item.setTitle(questionData.title);
      if (questionData.description) {
        item.setHelpText(questionData.description);
      }
      item.setRequired(questionData.required || false);
    });
  });

  Logger.log('Form created! URL: ' + form.getPublishedUrl());
  Logger.log('Edit URL: ' + form.getEditUrl());
  
  return form;
}


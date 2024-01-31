// listens for the event of slot search form being submitted

$('#slot-search-form').on('submit', function(e) {
  e.preventDefault();
  slotSearch();
});

// listens for the event of clear slots button, clears contents of the slots element in html and hides slots holder row

$('#clear-slots').on('click', function(e) {
  $('#slots').html('');
  $('#slots-holder-row').hide();
});

function slotSearch() {
  clearUI();
  $('#loading-row').show();

  // Next, the code loops through the elements of the form.  

  // Grab Slot query parameters from the slot-search-form
  var form = document.getElementById('slot-search-form');

  // Create an empty dictionary called slotParams
  // var slotParams = {};
 // for(var i = 0; i < form.length; i++) {
 //   if (form.elements[i].name.startsWith('date-')) { continue; }
 //   slotParams[form.elements[i].name] = form.elements[i].value;
 // }
//  slotParams['start'] = {$ge: form.elements['date-start'].value, $lt: form.elements['date-end'].value};
//  FHIR.oauth2.ready(function(smart) {
    
    var slotParams = {};
for (var i = 0; i < form.length; i++) {
  if (form.elements[i].name.startsWith('date-')) { continue; }
  slotParams[form.elements[i].name] = form.elements[i].value;
}

// Get the date strings from the form elements
var startDate = form.elements['date-start'].value;
var endDate = form.elements['date-end'].value;

// Convert the date strings to Date objects
var startDateObj = new Date(startDate);
var endDateObj = new Date(endDate);

// Set the time portion to 12:00:00.000 and convert to UTC
startDateObj.setUTCHours(12, 0, 0, 0);
endDateObj.setUTCHours(12, 0, 0, 0);

// Convert the Date objects back to strings in the required format
var startDateString = startDateObj.toISOString();
var endDateString = endDateObj.toISOString();

// Set the start and end dates in slotParams
slotParams['start'] = {$ge: startDateString, $lt: endDateString};

FHIR.oauth2.ready(function(smart) {
    smart.api.fetchAll({type: 'Slot', query: slotParams}).then(

      function(slots) {
        if (slots.length) {
          var slotsHTML = '';
          slots.forEach(function(slot) {
           // below changing slot.type.text to slot.servicetype
            slotsHTML = slotsHTML + slotHTML(slot.id, slot.serviceType.text, slot.start, slot.end);
          });

          renderSlots(slotsHTML);
        }
        // If no Slots matched the criteria, inform the user
        else {
          renderSlots('<p>No Slots ;(</p>');
        }
      },

      // Display 'Failed to read Slots from FHIR server' if the call failed
      function() {
        clearUI();
        $('#errors').html('<p>Failed to read Slots from FHIR server</p>');
        $('#errors-row').show();
      }
    );
  });
}

function slotHTML(id, type, start, end) {
  console.log('Slot: id:[' + id + '] type:[' + type + '] start:[' + start + '] end:[' + end + ']');
  var slotReference = 'Slot/' + id,
      prettyStart = new Date(start).toISOString(),
      prettyEnd = new Date(end).toISOString();
      
  return "<div class='card'>" +
           "<div class='card-body'>" +
             "<h5 class='card-title'>" + type + '</h5>' +
             "<p class='card-text'>Start: " + prettyStart + '</p>' +
             "<p class='card-text'>End: " + prettyEnd + '</p>' +
             "<a href='javascript:void(0);' class='card-link' onclick='askForPatient(\"" +
               slotReference + '", "' + type + '", "' + prettyStart + '", "' + prettyEnd + "\");'>Book</a>" +
           '</div>' +
         '</div>';
}




//function slotHTML(id, type, start, end) {
 // console.log('Slot: id:[' + id + '] type:[' + type + '] start:[' + start + '] end:[' + end + ']');
 // var slotReference = 'Slot/' + id,
   //   prettyStart = new Date(start),
   //   prettyEnd = new Date(end);

 // return "<div class='card'>" +
 //          "<div class='card-body'>" +
 //            "<h5 class='card-title'>" + type + '</h5>' +
 //            "<p class='card-text'>Start: " + prettyStart + '</p>' +
 //            "<p class='card-text'>End: " + prettyEnd + '</p>' +
 //            "<a href='javascript:void(0);' class='card-link' onclick='askForPatient(\"" +
 //              slotReference + '", "' + type + '", "' + prettyStart + '", "' + prettyEnd + "\");'>Book</a>" +
 //          '</div>' +
//         '</div>';
//}

// The code you provided defines two JavaScript functions: renderSlots() and clearUI().

// The renderSlots() function takes an HTML string as its argument and renders it in the browser. The function first calls the clearUI() function to clear the existing UI. Then, the function sets the inner HTML of the #slots element to the value of the slotsHTML argument. Finally, the function shows the #slots-holder-row element.

function renderSlots(slotsHTML) {
  clearUI();
  $('#slots').html(slotsHTML);
  $('#slots-holder-row').show();
}

// The clearUI() function clears the existing UI by setting the inner HTML of all the elements in the UI to an empty string and hiding all the elements.

//renderSlots(): This function renders the HTML for the slots in the browser.
//clearUI(): This function clears the existing UI.
//#slots: This is the ID of the element that will be used to display the slots.
//#slots-holder-row: This is the ID of the row that contains the #slots element.

// The clearUI() function uses the querySelector() method to get the elements in the UI. The querySelector() method takes a CSS selector as its argument and returns the first element that matches the selector.
// The clearUI() function uses the innerHTML property to set the inner HTML of an element. The innerHTML property is a read-only property that returns the inner HTML of an element.
// The show() method is used to show an element. The show() method takes an element as its argument and makes the element visible.

function clearUI() {
  $('#errors').html('');
  $('#errors-row').hide();
  $('#loading-row').hide();
  $('#slots').html('');
  $('#slots-holder-row').hide();
  $('#appointment').html('');
  $('#appointment-holder-row').hide();
  $('#patient-search-create-row').hide();
  clearPatientUI();
}
;
$('#clear-appointment').on('click', function(e) {
  $('#appointment').html('');
  $('#appointment-holder-row').hide();
});

function appointmentCreate(slotReference, patientReference) {
  clearUI();
  $('#loading-row').show();

  var appointmentBody = appointmentJSON(slotReference, patientReference);

  // FHIR.oauth2.ready handles refreshing access tokens
  FHIR.oauth2.ready(function(smart) {
    smart.api.create({resource: appointmentBody}).then(

      // Display Appointment information if the call succeeded
      function(appointment) {
        renderAppointment(appointment.headers('Location'));
      },

      // Display 'Failed to write Appointment to FHIR server' if the call failed
      function() {
        clearUI();
        $('#errors').html('<p>Failed to write Appointment to FHIR server</p>');
        $('#errors-row').show();
      }
    );
  });
}

function appointmentJSON(slotReference, patientReference) {
  return {
    resourceType: 'Appointment',
    slot: [
      {
        reference: slotReference
      }
    ],
    participant: [
      {
        actor: {
          reference: patientReference
        },
        status: 'needs-action'
      }
    ],
    status: 'proposed'
  };
}

function renderAppointment(appointmentLocation) {
  clearUI();
  $('#appointment').html('<p>Created Appointment ' + appointmentLocation.match(/\d+$/)[0] + '</p>');
  $('#appointment-holder-row').show();
}

$('#patient-search-form').on('submit', function(e) {
  e.preventDefault();
  patientSearch();
});

$('#patient-create-form').on('submit', function(e) {
  e.preventDefault();
  patientCreate();
});

$('#clear-patients').on('click', function(e) {
  $('#patients').html('');
  $('#patients-holder-row').hide();
});

function askForPatient(slotReference, type, start, end) {
  clearUI();
  $('#patient-search-create-row').show();

  $('#patient-search-create-info').html(
    '<p>To book Appointment [' + type + '] on ' + new Date(start).toLocaleDateString() +
    ' at ' + new Date(start).toLocaleTimeString() + ' - ' + new Date(end).toLocaleTimeString() +
    ', select a Patient.</p>'
  );
  sessionStorage.setItem('slotReference', slotReference);
}

function patientSearch() {
  clearPatientUI();
  $('#patient-loading-row').show();

  var form = document.getElementById('patient-search-form');
  var patientParams = {name: form.elements[0].value};

  FHIR.oauth2.ready(function(smart) {
    smart.api.fetchAll({type: 'Patient', query: patientParams}).then(

      // Display Patient information if the call succeeded
      function(patients) {
        // If any Patients matched the criteria, display them
        if (patients.length) {
          var patientsHTML = '',
              slotReference = sessionStorage.getItem('slotReference');

          patients.forEach(function(patient) {
            var patientName = patient.name[0].given.join(' ') + ' ' + patient.name[0].family;
            patientsHTML = patientsHTML + patientHTML(slotReference, patient.id, patientName);
          });

          form.reset();
          renderPatients(patientsHTML);
        }
        // If no Patients matched the criteria, inform the user
        else {
          renderPatients('<p>No Patients found for the selected query parameters.</p>');
        }
      },

      // Display 'Failed to read Patients from FHIR server' if the call failed
      function() {
        clearPatientUI();
        $('#patient-errors').html('<p>I will fail if this search is embedded</p>');
        $('#patient-errors-row').show();
      }
    );
  });
}

function patientHTML(slotReference, patientId, patientName) {
  console.log('Patient: name:[' + patientName + ']');

  var patientReference = 'Patient/' + patientId;

  return "<div class='card'>" +
           "<div class='card-body'>" +
             "<h5 class='card-title'>" + patientName + '</h5>' +
             "<a href='javascript:void(0);' class='card-link' onclick='appointmentCreate(\"" +
               slotReference + '", "' + patientReference + "\");'>Use Patient</a>" +
           '</div>' +
         '</div>';
}

function patientCreate() {
  clearPatientUI();
  $('#patient-loading-row').show();

  // Grab Patient POST body attributes from the patient-create-form
  var form = document.getElementById('patient-create-form');

  var patientBody = patientJSON(
    form.elements['patient-create-firstname'].value,
    form.elements['patient-create-middlename'].value,
    form.elements['patient-create-lastname'].value,
    form.elements['patient-create-phone'].value,
    form.elements['patient-create-male'].checked ? 'male' : 'female',
    form.elements['patient-create-birthdate'].value
  );

  // FHIR.oauth2.ready handles refreshing access tokens
  FHIR.oauth2.ready(function(smart) {
    smart.api.create({resource: patientBody}).then(

      // Display Patient information if the call succeeded
      function(patient) {
        $('#patient-loading-row').hide();
        form.reset();
        alert('Created Patient ' + patient.headers('Location').match(/\d+$/)[0] + '\n\nSearch for them by name.');
      },

      // Display 'Failed to write Patient to FHIR server' if the call failed
      function() {
        $('#patient-loading-row').hide();
        alert('Failed to write Patient to FHIR server');
      }
    );
  });
}

function patientJSON(firstName, middleName, lastName, phone, gender, birthDate) {
  var periodStart = new Date().toISOString();

  return {
    resourceType: 'Patient',
    identifier: [
      {
        assigner: {
          reference: 'Organization/675844'
        }
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: [
          lastName
        ],
        given: [
          firstName,
          middleName
        ],
        period: {
          start: periodStart
        }
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: phone,
        use: 'home'
      }
    ],
    gender: gender,
    birthDate: birthDate
  };
}

function renderPatients(patientsHTML) {
  clearPatientUI();
  $('#patients').html(patientsHTML);
  $('#patients-holder-row').show();
}

function clearPatientUI() {
  $('#patient-errors').html('');
  $('#patient-errors-row').hide();
  $('#patient-loading-row').hide();
  $('#patients').html('');
  $('#patients-holder-row').hide();
}

$('#slot-search-form').on('submit', function(e) {
  e.preventDefault();
  slotSearch();
});


$('#clear-slots').on('click', function(e) {
  $('#slots').html('');
  $('#slots-holder-row').hide();
});

function slotSearch() {
  clearUI();
  $('#loading-row').show();

  var form = document.getElementById('slot-search-form');
  //The two below are new
 
 var selectedSlotType = ""
 var selectedOption = form.elements["service-type"].selectedOptions[0];
 var selectedSlotType = selectedOption.textContent;
 console.log("Selected Slot Type: " + selectedSlotType);
// var selectedOption = form.elements["service-type"].selectedOptions[0];
 //var serviceTypeText = selectedOption.textContent;
 
  // 

    var slotParams = {};
for (var i = 0; i < form.length; i++) {
  if (form.elements[i].name.startsWith('date-')) { continue; }
  slotParams[form.elements[i].name] = form.elements[i].value;
}

var startDate = form.elements['date-start'].value;
var endDate = form.elements['date-end'].value;

var startDateObj = new Date(startDate);
var endDateObj = new Date(endDate);

startDateObj.setUTCHours(12, 0, 0, 0);
endDateObj.setUTCHours(12, 0, 0, 0);

var startDateString = startDateObj.toISOString();
var endDateString = endDateObj.toISOString();

slotParams['start'] = {$ge: startDateString, $lt: endDateString};

FHIR.oauth2.ready(function(smart) {
  smart.api.fetchAll({type: 'Slot', query: slotParams}).then(

    function(slots) {
      if (slots.length) {
        var slotsHTML = '';
        slots.forEach(function(slot) {
          console.log("Slot object:", slot); 
          // get the serviceType text value
          var serviceTypeText = slot.serviceType ? slot.serviceType.text : null;
          // get the first coding object from the serviceType coding array
          var serviceTypeCoding = slot.serviceType && slot.serviceType.coding ? slot.serviceType.coding[0] : null;
          // get the code and display values from the coding object
          var serviceTypeCode = serviceTypeCoding ? serviceTypeCoding.code : null;
          var serviceTypeDisplay = serviceTypeCoding ? serviceTypeCoding.display : null;
          // use the variables as the parameters of the slotHTML function
          slotsHTML = slotsHTML + slotHTML(slot.id, serviceTypeText, serviceTypeCode, serviceTypeDisplay, slot.start, slot.end);
          console.log("Slots object:", slotHTML); 
          console.log("Slots htm:", slotsHTML); 
        });

        renderSlots(slotsHTML);
      }
    }
  );
});
}
// this is the function that you provided, with one line removed
function slotHTML(id, serviceTypeText, serviceTypeCode, serviceTypeDisplay, start, end, type) {
console.log('Slot: id:[' + id + '] serviceTypeText:[' + serviceTypeText + '] start:[' + start + '] end:[' + end + '] type:[' + type + ']');
var slotReference = 'Slot/' + id,
    prettyStart = new Date(start).toISOString(),
    prettyEnd = new Date(end).toISOString();
  
 //The two below are new
 var form = document.getElementById('slot-search-form');
 var selectedSlotType = ""
 var selectedOption = form.elements["service-type"].selectedOptions[0];
 var selectedSlotType = selectedOption.textContent;

 console.log("Selected Slot Type: " + selectedSlotType);
return "<div class='card'>" +
         "<div class='card-body'>" +
           "<h5 class='card-title'>" + selectedSlotType + '</h5>' +
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


function renderSlots(slotsHTML) {
  clearUI();
  $('#slots').html(slotsHTML);
  $('#slots-holder-row').show();
}

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
        status: 'accepted'
      }
    ],
    "reasonCode": [
      {
        "text": "I have a cramp"
      }
    ],
    status: 'booked'
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
    "extension": [
      {
        "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex",
        "valueCode": "M"
      },
      {
        "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
        "extension": [
          {
            "url": "ombCategory",
            "valueCoding": {
              "system": "urn:oid:2.16.840.1.113883.6.238",
              "code": "2028-9",
              "display": "Asian"
            }
          },
          {
            "url": "detailed",
            "valueCoding": {
              "system": "urn:oid:2.16.840.1.113883.6.238",
              "code": "2039-6",
              "display": "Japanese"
            }
          }
        ]
      },
      {
        "url": "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
        "extension": [
          {
            "url": "ombCategory",
            "valueCoding": {
              "system": "urn:oid:2.16.840.1.113883.6.238",
              "code": "2186-5",
              "display": "Non Hispanic or Latino"
            }
          }
        ]
      }
    ],
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
          "lastName"
        ],
        given: [
          "firstName",
          "middleName"
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
    birthDate: birthDate,
    "address": [
      {
        "use": "home",
        "line": [
          "121212 Metcalf Drive",
          "Apartment 403"
        ],
        "city": "Kansas City",
        "district": "Jackson",
        "state": "KS",
        "postalCode": "64199",
        "country": "United States of America",
        "period": {
          "start": "2012-05-17T15:33:18.000Z"
        }
      }
    ],
    "maritalStatus": {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/v3-NullFlavor",
          "code": "UNK",
          "display": "Unknown"
        }
      ],
      "text": "Unknown"
    },
    "communication": [
      {
        "language": {
          "coding": [
            {
              "system": "urn:ietf:bcp:47",
              "code": "en",
              "display": "English"
            }
          ],
          "text": "English"
        },
        "preferred": true
      }
    ],
    "generalPractitioner": [
      {
        "reference": "Practitioner/593923"
      }
    ]
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
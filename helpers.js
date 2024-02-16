//
// Loop before a token expire to fetch a new one
//
function initializeRefreshTokenStrategy(shellSdk, SHELL_EVENTS, auth) {

  shellSdk.on(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, (event) => {
    sessionStorage.setItem('token', event.access_token);
    setTimeout(() => fetchToken(), (event.expires_in * 1000) - 5000);
  });

  function fetchToken() {
    shellSdk.emit(SHELL_EVENTS.Version1.REQUIRE_AUTHENTICATION, {
      response_type: 'token'  // request a user token within the context
    });
  }

  sessionStorage.setItem('token', auth.access_token);
  setTimeout(() => fetchToken(), (auth.expires_in * 1000) - 5000);
}

// 
// Request context with activity ID to return the activities data
//
function getActivity(cloudHost, account, company, activityID) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

    // Fetch Activity object
    fetch(`https://${cloudHost}/api/data/v4/Activity/${activityID}?dtos=Activity.42&account=${account}&company=${company}`, 
      {headers})
      .then(response => response.json())
      .then(function(json) {
        resolve(json.data[0].activity);
      });
  });
}

function getChecklistInstance(cloudHost, account, company, activityID) {
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': 'fsm-extension-sample',
    'X-Client-Version': '1.0.0',
    'Cache-Control': 'no-cache',
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  // We want to query for all checklists on that actvity and join in the template name
  const clQuery = `SELECT checklistInstance.id,\
       checklistInstance.dataVersion,\
       checklistInstance.version,\
       checklistInstance.closed,\
	     checklistInstance.language,\
	     checklistInstance.lastChanged,\
	     checklistInstance.createPerson,\
	     checklistInstance.createDateTime,\
	     checklistInstance.responsiblePerson,\
	     checklistInstance.description,\
		   checklistTemplate.name,\
			 checklistTemplate.description,\
			 checklistTemplate.version,\
			 checklistTemplate.status,\
			 checklistTemplate.defaultLanguage \
    FROM ChecklistInstance checklistInstance \
    JOIN ChecklistTemplate checklistTemplate \
      ON checklistTemplate.id=checklistInstance.template \
    WHERE checklistInstance.object.objectId="${activityID}";`;
  
  // Data Transfer Object versions we use
  const dtos = 'ChecklistInstance.20;ChecklistTemplate.20';

  return new Promise(resolve => {
    // Fetch data from webservice and return it
    fetch(`https://${cloudHost}/api/query/v1?dtos=${dtos}&account=${account}&company=${company}&query="${clQuery}"`, 
      {headers})
      .then(response => response.json())
      .then(function(json) {
        resolve(json.data);
      });
  });
}
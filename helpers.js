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
    'Authorization': `bearer ${sessionStorage.getItem('token')}`,
  };

  return new Promise(resolve => {

    // Fetch Activity object
    fetch(`https://${cloudHost}/api/data/v4/Activity/${activityID}?dtos=Activity.42&account=${account}&company=${company}`, {headers})
      .then(response => response.json())
      .then(function(json) {
        const activity = json.data[0].activity;
        // Fetch all ChecklistInstances
        fetch(`https://${cloudHost}/api/data/v4/ChecklistInstance?dtos=ChecklistInstance.20&account=${account}&company=${company}?query=object.objectId="${activityID}"`, {headers})
            .then(response => response.json())
            .then(function(json) {

              const ChecklistInstance = json.data.find((element) => element.checklistInstance.object.objectId === activity.id);
              if (!ChecklistInstance) {
                resolve(null);
              } else {
                fetch(`https://${cloudHost}/api/data/v4/ChecklistInstance/${ChecklistInstance.id}?dtos=ChecklistInstance.20&account=${account}&company=${company}`, {
                  headers
                  })
                    .then(response => response.json())
                    .then(function(json) {
                      resolve(json.data[0].checklist);
                    });
              }
            });
      });
  });
}
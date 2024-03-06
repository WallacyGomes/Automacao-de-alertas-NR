const axios = require('axios');

const url = 'https://api.newrelic.com/graphql';
const apiKey = 'Coloque sua API Key aqui';

async function getApms() {

  const query = `
    query{
      actor {
        entities(guids: ["coloque o guid das entidades aqui"]) 
      {
          name
          ... on ApmApplicationEntity {
            guid
            name
          }
        }
      }
    }
  `;

  const queryStringify = JSON.stringify({query});

  const response = await axios.post(url, queryStringify, {
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    }
  });
  
  const queryConfig = {
    errorRate: {
      web: {
        name: "(Web) | Error Rate (%)(AVG)",
        transactionType: "Web",
        critical: {
          threshold: 5,
          thresholdDuration: 300,
        },
        warning: {
          threshold: 3,
          thresholdDuration: 300,
        }
      },
      nonWeb: {
        name: "(Non-Web) | Error Rate (%)(AVG)",
        transactionType: "Other",
        critical: {
          threshold: 5,
          thresholdDuration: 300,
        },
        warning: {
          threshold: 3,
          thresholdDuration: 600,
        }
      }
    },
    responseTime: {
      web: {
        name: "(Web) | Response Time (AVG)(HIGH)",
        transactionType: "Web",
        critical: {
          threshold: 0.6,
          thresholdDuration: 300,
        },
        warning: {
          threshold: 0.3,
          thresholdDuration: 600,
        }
      },
      nonWeb: {
        name: "(Non-Web) | Response Time (AVG)(HIGH)",
        transactionType: "Other",
        critical: {
          threshold: 10,
          thresholdDuration: 600,
        },
        warning: {
          threshold: 5,
          thresholdDuration: 600,
        }
      }
    }
};
  
  const entity = response.data.data.actor.entities;

  for (const apm of entity) {
    await criarAlertaErrorRate(apm.name, queryConfig.errorRate.web);
    await criarAlertaErrorRate(apm.name, queryConfig.errorRate.nonWeb);
    await criarAlertaResponseTime(apm.name, queryConfig.responseTime.web);
    await criarAlertaResponseTime(apm.name, queryConfig.responseTime.nonWeb);
  }


}

getApms();

async function criarAlertaErrorRate(apms, queryConfig) {

  const query = `
    mutation{
      alertsNrqlConditionStaticCreate(
        accountId: Id da sua conta (sem aspas)
        policyId: "Id da sua policy"
        condition: {
          name: "${apms} ${queryConfig.name}",
          enabled: true,
          nrql: {
            query: "FROM Metric SELECT (count(apm.service.error.count)/count(apm.service.transaction.duration))*100 WHERE appName = '${apms}' AND transactionType = '${queryConfig.transactionType}' FACET appName"
          }, 
          signal: {
            aggregationWindow: 60,
            aggregationMethod: EVENT_FLOW,
            aggregationDelay: 120
          }, 
          terms: [
            {
              threshold: ${queryConfig.critical.threshold}, 
              thresholdOccurrences: ALL, 
              thresholdDuration: ${queryConfig.critical.thresholdDuration}, 
              operator: ABOVE, 
              priority: CRITICAL
            },
            {
              threshold: ${queryConfig.warning.threshold}, 
              thresholdOccurrences: ALL, 
              thresholdDuration: ${queryConfig.warning.thresholdDuration}, 
              operator: ABOVE, 
              priority: WARNING
            }
          ],
          valueFunction: SINGLE_VALUE,
          violationTimeLimitSeconds: 86400
        }
      ) {
        id
        name
      }
    }
  `;

  const queryStringify = JSON.stringify({query});

  axios.post(url, queryStringify, {
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    }
  })
  .then(r => console.log(r.data));

}

async function criarAlertaResponseTime(apms, queryConfig) {

  const query = `
    mutation{
      alertsNrqlConditionStaticCreate(
        accountId: Id da sua conta
        policyId: "Id da sua policy"
        condition: {
          name: "${apms} ${queryConfig.name}",
          enabled: true,
          nrql: {
            query: "FROM Metric SELECT average(apm.service.transaction.duration) WHERE appName = '${apms}' AND transactionType = '${queryConfig.transactionType}' FACET appName"
          }, 
          signal: {
            aggregationWindow: 60,
            aggregationMethod: EVENT_FLOW,
            aggregationDelay: 120
          }, 
          terms: [
            {
              threshold: ${queryConfig.critical.threshold}, 
              thresholdOccurrences: ALL, 
              thresholdDuration: ${queryConfig.critical.thresholdDuration}, 
              operator: ABOVE, 
              priority: CRITICAL
            },
            {
              threshold: ${queryConfig.warning.threshold}, 
              thresholdOccurrences: ALL, 
              thresholdDuration: ${queryConfig.warning.thresholdDuration}, 
              operator: ABOVE, 
              priority: WARNING
            }
          ],
          valueFunction: SINGLE_VALUE,
          violationTimeLimitSeconds: 86400
        }
      ) {
        id
        name
      }
    }
  `;

  const queryStringify = JSON.stringify({ query });

  axios.post(url, queryStringify, {
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey,
    }
  })
  .then(r => console.log(r.data));

}
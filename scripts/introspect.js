import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const url = "https://internal.nbn23.app/graphql";
const headers = {
  'Host': 'internal.nbn23.app',
  'x-package-name': 'com.nbn23.fipapp',
  'Accept': '*/*',
  'x-user-premium': 'true',
  'Authorization': process.env.FIP_AUTH_TOKEN,
  'Content-Type': 'application/json',
  'User-Agent': 'com.nbn23.fipapp',
  'x-package-version': '2.14.0'
};

// La query standard universale per estrarre l'intero schema GraphQL
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      types {
        kind
        name
        description
        fields(includeDeprecated: true) {
          name
          description
          args { name type { kind name } }
          type { kind name ofType { kind name } }
        }
      }
    }
  }
`;

async function fetchSchema() {
  console.log("🕵️ Attempting GraphQL Introspection...");
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: introspectionQuery })
    });
    
    const json = await res.json();
    
    if (json.errors) {
      console.log("❌ Introspection Disabled by Server:");
      console.log(json.errors[0].message);
    } else {
      fs.writeFileSync('./schema.json', JSON.stringify(json, null, 2));
      console.log("✅ BINGO! Full Schema downloaded to schema.json");
    }
  } catch (err) {
    console.error("Network error:", err);
  }
}

fetchSchema();
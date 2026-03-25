# env-config-helper

Lightweight utilities for reading and validating environment variables in Node.js projects.

## Usage

```js
const { getEnvVar, requireEnvVar, parseEnvFile } = require('env-config-helper');

const port = getEnvVar('PORT', 3000);
const apiKey = requireEnvVar('API_KEY');
```

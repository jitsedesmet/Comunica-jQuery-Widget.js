/*! @license MIT ©2024 Ghent University – imec */
// WebMCP (Web Model Context Protocol) tools for Comunica Query UI
// See: https://github.com/webmachinelearning/webmcp
// Enables AI agents to interact with the SPARQL query interface

// WebMCP Tools Manager
// Provides tools for AI agents to interact with the Comunica query interface
(function (exports) {
  function WebMCPTools(queryUI) {
    this.queryUI = queryUI;
    this.toolsRegistered = false;
  }

  WebMCPTools.prototype = {

    /**
     * Check if WebMCP is available in the browser
     */
    isAvailable: function () {
      return typeof window !== 'undefined' &&
             window.navigator &&
             typeof window.navigator.modelContext !== 'undefined';
    },

    /**
     * Register all tools with the browser's WebMCP interface
     */
    registerTools: function () {
      if (!this.isAvailable()) {
        // eslint-disable-next-line no-console
        console.log('WebMCP not available in this browser');
        return false;
      }

      try {
        const tools = this._buildToolDefinitions();
        window.navigator.modelContext.provideContext({ tools: tools });
        this.toolsRegistered = true;
        // eslint-disable-next-line no-console
        console.log('WebMCP tools registered successfully:', tools.length, 'tools');

        // Show visual indicator
        const statusElement = document.getElementById('webmcp-status');
        if (statusElement)
          statusElement.style.display = 'block';


        return true;
      }
      catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to register WebMCP tools:', error);
        return false;
      }
    },

    /**
     * Build all tool definitions for WebMCP
     */
    _buildToolDefinitions: function () {
      const self = this;

      return [
        // Tool 1: Change datasources
        {
          name: 'change-datasources',
          description: 'Change the data sources for SPARQL queries.' +
            'You can specify known data source names (e.g., "DBpedia 2016-04", "Wikidata SPARQL") or custom RDF sources providing their URLs.',
          inputSchema: {
            type: 'object',
            properties: {
              datasources: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of datasource names or URLs to query. Use datasource names from the available list or provide custom URLs.',
              },
            },
            required: ['datasources'],
          },
          execute: function ({ datasources }, agent) {
            return self._executeTool('change-datasources', { datasources }, agent);
          },
        },

        // Tool 2: Pick a date
        {
          name: 'set-datetime',
          description: 'Set a specific date/time for temporal queries. This allows you to specify the result of the SPARQL `NOW()` operator.',
          inputSchema: {
            type: 'object',
            properties: {
              datetime: {
                type: 'string',
                description: 'ISO 8601 date string (YYYY-MM-DD)',
              },
            },
            required: ['datetime'],
          },
          execute: function ({ datetime }, agent) {
            return self._executeTool('set-datetime', { datetime }, agent);
          },
        },

        // Tool 3: Set bypass cache
        {
          name: 'set-bypass-cache',
          description: 'Enable or disable cache bypassing.' +
            'Should not be used by default, but cam be used when you notice stale or cached results, or when you need fresh data.',
          inputSchema: {
            type: 'object',
            properties: {
              bypass: {
                type: 'boolean',
                description: 'Set to true to bypass cache, false to use cached results',
              },
            },
            required: ['bypass'],
          },
          execute: function ({ bypass }, agent) {
            return self._executeTool('set-bypass-cache', { bypass }, agent);
          },
        },

        // Tool 4: Change CONSTRUCT format
        {
          name: 'set-result-format',
          description: 'Set the output format for CONSTRUCT queries (e.g., Turtle, N-Triples, JSON-LD, TriG).',
          inputSchema: {
            type: 'object',
            properties: {
              format: {
                type: 'string',
                description: 'Media type for CONSTRUCT results (e.g., "text/turtle", "application/n-triples", "application/ld+json", "application/trig")',
                enum: [
                  'application/n-quads',
                  'application/trig',
                  'application/ld+json',
                  'application/n-triples',
                  'text/turtle',
                  'text/n3',
                  'text/shaclc',
                  'text/shaclc-ext',
                ],
              },
            },
            required: ['format'],
          },
          execute: function ({ format }, agent) {
            return self._executeTool('set-result-format', { format }, agent);
          },
        },

        // Tool 5: List datasources
        {
          name: 'get-datasources-list',
          description: 'Get the complete list of well-known datasources. Returns all configured datasource known by name instead of URL.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: function (params, agent) {
            return self._executeTool('get-datasources-list', {}, agent);
          },
        },
        // Tool 6: List and explain queries
        {
          name: 'list-queries',
          description: 'List available example queries. Useful for discovering pre-made queries.',
          inputSchema: {
            type: 'object',
            properties: {
              datasource: {
                type: 'string',
                description: 'Optional: Filter queries by datasource name (e.g., "dbpedia", "wikidata")',
              },
            },
          },
          execute: function ({ datasource }, agent) {
            return self._executeTool('list-queries', { datasource }, agent);
          },
        },

        // Tool 7: Insert query
        {
          name: 'insert-query',
          description: 'Insert a SPARQL query into the query editor. ' +
            'Use this to suggest queries based on natural language requests. ' +
            'The query should be valid SPARQL syntax, meaning special care should be taken on PREFIX and BASE declarations.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The SPARQL query to insert into the editor',
              },
              suggestDatasources: {
                type: 'boolean',
                description: 'If true, suggest appropriate datasources for this query',
              },
            },
            required: ['query'],
          },
          execute: function ({ query, suggestDatasources }, agent) {
            return self._executeTool('insert-query', { query, suggestDatasources }, agent);
          },
        },
        // Tool 8: Execute query
        {
          name: 'execute-query',
          description: 'Execute the current SPARQL query. ' +
            'Make sure datasource\'s are configured before executing. ' +
            'After executing the query, you should verify no errors are immediately thrown (e.g. parser errors). ' +
            'When an error is immediately thrown, try to fix it.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: function (params, agent) {
            return self._executeTool('execute-query', {}, agent);
          },
        },

        // Tool 9: Get query results
        {
          name: 'get-query-results',
          description: 'Get the results from the most recent query execution. ' +
            'These can be used if the agent is tasked to explain the query result. ' +
            'Results have a structured format. But the triples send are limited for bandwidth reasons.',
          inputSchema: {
            type: 'object',
            properties: {
              maxResults: {
                type: 'number',
                description: 'Maximum number of results to return (default: 100, max: 1000)',
              },
            },
          },
          execute: function ({ maxResults }, agent) {
            return self._executeTool('get-query-results', { maxResults }, agent);
          },
        },
        // Tool 10: Get query errors
        {
          name: 'get-query-errors',
          description: 'Get any errors from the most recent query execution. ' +
            'Use this to detect and fix query problems like syntax errors, missing prefixes, or invalid SPARQL syntax.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: function (params, agent) {
            return self._executeTool('get-query-errors', {}, agent);
          },
        },
        // Tool 11: Get query status
        {
          name: 'get-query-status',
          description: 'Check if a query is currently running and get basic status information.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
          execute: function (params, agent) {
            return self._executeTool('get-query-status', {}, agent);
          },
        },
      ];
    },

    /**
     * Execute a specific tool
     */
    _executeTool: function (toolName, params, agent) {
      try {
        switch (toolName) {
        case 'change-datasources':
          return this._changeDatasources(params.datasources, agent);

        case 'set-datetime':
          return this._setDatetime(params.datetime, agent);

        case 'set-bypass-cache':
          return this._setBypassCache(params.bypass, agent);

        case 'set-result-format':
          return this._setResultFormat(params.format, agent);

        case 'get-datasources-list':
          return this._getDatasourcesList(agent);

        case 'list-queries':
          return this._listQueries(params.datasource, agent);

        case 'insert-query':
          return this._insertQuery(params.query, params.suggestDatasources, agent);

        case 'execute-query':
          return this._executeQuery(agent);

        case 'get-query-results':
          return this._getQueryResults(params.maxResults || 100, agent);

        case 'get-query-errors':
          return this._getQueryErrors(agent);

        case 'get-query-status':
          return this._getQueryStatus(agent);

        default:
          throw new Error('Unknown tool: ' + toolName);
        }
      }
      catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error executing tool ' + toolName + ': ' + error.message,
            },
          ],
          isError: true,
        };
      }
    },

    /**
     * Tool implementation: Change data sources
     */
    _changeDatasources: function (datasources, agent) {
      const availableDS = this.queryUI.options.datasources;
      const $datasources = this.queryUI.$datasources;

      // Map datasource names to URLs
      const selectedUrls = [];
      const notFound = [];

      datasources.forEach(function (ds) {
        // Check if it's a URL (contains ://)
        if (ds.indexOf('://') !== -1 || ds.indexOf('//') === 0)
          selectedUrls.push(ds);
        else {
          // Try to find by name
          const found = availableDS.find(function (availDS) {
            return availDS.name.toLowerCase() === ds.toLowerCase();
          });

          if (found)
            selectedUrls.push(found.url);
          else
            notFound.push(ds);
        }
      });

      // Update the UI
      $datasources.val(selectedUrls);
      $datasources.trigger('chosen:updated');
      $datasources.trigger('change');

      let message = 'Changed datasources to: ' + selectedUrls.join(', ');
      if (notFound.length > 0) {
        message += '\n\nNote: Could not find these datasources: ' + notFound.join(', ');
        message += '\n\nAvailable datasources: ' + availableDS.map(function (ds) { return ds.name; }).join(', ');
      }

      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    },

    /**
     * Tool implementation: Set datetime
     */
    _setDatetime: function (datetime, agent) {
      const $datetime = this.queryUI.$datetime;
      $datetime.val(datetime);
      $datetime.trigger('change');

      return {
        content: [
          {
            type: 'text',
            text: 'Set temporal query date to: ' + datetime,
          },
        ],
      };
    },

    /**
     * Tool implementation: Set bypass cache
     */
    _setBypassCache: function (bypass, agent) {
      const $bypassCache = this.queryUI.$bypassCache;
      $bypassCache.prop('checked', bypass);
      $bypassCache.trigger('change');

      return {
        content: [
          {
            type: 'text',
            text: 'Cache bypass ' + (bypass ? 'enabled' : 'disabled') + '. ' +
                  (bypass ? 'Queries will fetch fresh data.' : 'Queries will use cached results when available.'),
          },
        ],
      };
    },

    /**
     * Tool implementation: Set result format
     */
    _setResultFormat: function (format, agent) {
      const $resultMediaType = this.queryUI.$resultMediaType;

      // Check if format is available
      const available = Array.from($resultMediaType[0].options).map(function (opt) {
        return opt.value;
      });

      if (available.indexOf(format) === -1) {
        return {
          content: [
            {
              type: 'text',
              text: 'Format "' + format + '" is not available. Available formats: ' + available.join(', '),
            },
          ],
          isError: true,
        };
      }

      $resultMediaType.val(format);
      $resultMediaType.trigger('change');

      return {
        content: [
          {
            type: 'text',
            text: 'Changed CONSTRUCT query output format to: ' + format,
          },
        ],
      };
    },

    /**
     * Tool implementation: Get known data sources list
     */
    _getDatasourcesList: function (agent) {
      const datasources = this.queryUI.options.datasources;

      if (!datasources || datasources.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No data sources available.',
            },
          ],
        };
      }

      // Build complete list of datasources
      let text = 'Available known data sources (' + datasources.length + ' total):\n\n';

      datasources.forEach(function (ds, index) {
        text += (index + 1) + '. ' + ds.name + '\n';
        text += '   URL: ' + ds.url + '\n\n';
      });

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    },

    /**
     * Tool implementation: List queries
     */
    _listQueries: function (datasource, agent) {
      const queries = this.queryUI.options.queries;

      // Filter by datasource if specified
      let filteredQueries = queries;
      if (datasource) {
        const dsLower = datasource.toLowerCase();
        filteredQueries = queries.filter(function (q) {
          return q.datasource && q.datasource.toLowerCase().indexOf(dsLower) !== -1;
        });
      }

      if (filteredQueries.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: datasource ?
                'No queries found for datasource: ' + datasource :
                'No queries available.',
            },
          ],
        };
      }

      // Build query list with explanations
      let text = 'Available queries' + (datasource ? ' for ' + datasource : '') + ':\n\n';

      filteredQueries.forEach(function (query, index) {
        text += (index + 1) + '. ' + query.name + '\n';
        if (query.datasource)
          text += '   Datasource: ' + query.datasource + '\n';


        // Try to extract a description from the query
        if (query.sparql) {
          const lines = query.sparql.split('\n');
          const commentLines = lines.filter(function (line) {
            return line.trim().startsWith('#');
          });
          if (commentLines.length > 0)
            text += '   Description: ' + commentLines[0].replace(/^#\s*/, '').trim() + '\n';
        }
        text += '\n';
      });

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    },

    /**
     * Tool implementation: Insert query
     */
    _insertQuery: function (query, suggestDatasources, agent) {
      // Set the query text - use the current query format's text area
      const queryFormat = this.queryUI.options.queryFormat || 'sparql';
      const $queryText = this.queryUI.$queryTextsIndexed[queryFormat];

      if ($queryText) {
        if ($queryText.yasqe)
          $queryText.yasqe.setValue(query);
        else {
          $queryText.val(query);
          $queryText.trigger('change');
        }
      }

      let message = 'Query inserted into editor:\n\n' + query;

      // Suggest datasources if requested
      if (suggestDatasources) {
        // Simple heuristic: look for common datasource patterns
        const suggestions = [];

        if (query.toLowerCase().indexOf('dbpedia') !== -1)
          suggestions.push('DBpedia SPARQL');

        if (query.toLowerCase().indexOf('wikidata') !== -1 || query.toLowerCase().indexOf('wdt:') !== -1)
          suggestions.push('Wikidata SPARQL');

        if (query.toLowerCase().indexOf('foaf') !== -1 || query.toLowerCase().indexOf('solid') !== -1)
          suggestions.push('A personal Solid pod URL');


        if (suggestions.length > 0) {
          message += '\n\nSuggested datasources for this query: ' + suggestions.join(', ');
          message += '\nUse the change-datasources tool to set them.';
        }
        else
          message += '\n\nNo specific datasources suggested. You may need to configure appropriate datasources for this query.';
      }

      return {
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      };
    },

    /**
     * Tool implementation: Execute query
     */
    _executeQuery: function (agent) {
      // Check if datasources are selected
      const datasources = this.queryUI.$datasources.val();
      if (!datasources || datasources.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: No datasources selected. Please select or add datasources before executing the query.',
            },
          ],
          isError: true,
        };
      }

      // Check if a query is present
      const queryFormat = this.queryUI.options.queryFormat || 'sparql';
      const $queryText = this.queryUI.$queryTextsIndexed[queryFormat];

      let query = '';
      if ($queryText) {
        if ($queryText.yasqe)
          query = $queryText.yasqe.getValue();
        else
          query = $queryText.val();
      }

      if (!query || query.trim().length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: No query to execute. Please insert a query first.',
            },
          ],
          isError: true,
        };
      }

      // Trigger execution
      this.queryUI.$start.click();

      return {
        content: [
          {
            type: 'text',
            text: 'Query execution started. Use get-query-results to retrieve results once the query completes.',
          },
        ],
      };
    },

    /**
     * Tool implementation: Get query results
     */
    _getQueryResults: function (maxResults, agent) {
      const self = this;

      // Check if results are available
      if (!this.queryUI.lastResults) {
        return {
          content: [
            {
              type: 'text',
              text: 'No query results available. Execute a query first using the execute-query tool.',
            },
          ],
        };
      }

      const results = this.queryUI.lastResults;
      const queryType = this.queryUI.lastQueryType;

      // Build response based on query type
      let text = '';

      if (queryType === 'bindings') {
        // SELECT query results
        const variables = results.variables || [];
        const bindings = results.bindings || [];

        const count = Math.min(bindings.length, maxResults);

        text = 'Query returned ' + bindings.length + ' result(s)';
        if (count < bindings.length)
          text += ' (showing first ' + count + ')';

        text += ':\n\n';

        text += 'Variables: ' + variables.join(', ') + '\n\n';

        // Format results as table
        for (let i = 0; i < count; i++) {
          text += 'Result ' + (i + 1) + ':\n';
          const binding = bindings[i];

          variables.forEach(function (v) {
            if (binding[v])
              text += '  ' + v + ': ' + self._formatValue(binding[v]) + '\n';
          });
          text += '\n';
        }
      }
      else if (queryType === 'boolean') {
        // ASK query result
        text = 'Query result (ASK): ' + (results.value ? 'TRUE' : 'FALSE');
      }
      else if (queryType === 'quads') {
        // CONSTRUCT/DESCRIBE query result
        text = 'Query returned RDF quads (CONSTRUCT/DESCRIBE query).\n';
        text += 'Total quads: ' + (results.quads ? results.quads.length : 0);
      }
      else if (queryType === 'void')
        text = 'Query completed successfully (UPDATE query).';
      else
        text = 'Query completed with unknown result type: ' + queryType;


      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    },

    /**
     * Tool implementation: Get query errors
     */
    _getQueryErrors: function (agent) {
      const lastError = this.queryUI.lastError;

      if (!lastError) {
        return {
          content: [
            {
              type: 'text',
              text: 'No errors detected. The last query executed successfully or no query has been executed yet.',
            },
          ],
        };
      }

      let text = 'Query execution error detected:\n\n';
      text += 'Error: ' + (lastError.message || lastError.toString()) + '\n\n';
      text += 'Common causes:\n';
      text += '- Missing SPARQL prefixes (e.g., PREFIX dbpedia-owl: <http://dbpedia.org/ontology/>)\n';
      text += '- Syntax errors in the SPARQL query\n';
      text += '- Invalid URIs or property names\n';
      text += '- Incorrect datasource configuration\n\n';
      text += 'Please review the query syntax and try again. You can insert a corrected query using the insert-query tool.';

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    },

    /**
     * Tool implementation: Get query status
     */
    _getQueryStatus: function (agent) {
      const isRunning = this.queryUI.$start.is(':hidden');
      const executionTime = this.queryUI.$timing.text();

      let text = '';
      if (isRunning) {
        text = 'Query is currently running.';
        if (executionTime)
          text += ' Execution time: ' + executionTime;
      }
      else {
        text = 'No query is currently running.';
        if (executionTime)
          text += ' Last query execution time: ' + executionTime;
      }

      return {
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      };
    },

    /**
     * Format a SPARQL binding value for display
     */
    _formatValue: function (value) {
      if (!value) return '';

      if (value.type === 'uri')
        return '<' + value.value + '>';
      else if (value.type === 'literal') {
        let result = '"' + value.value + '"';
        if (value.datatype && value.datatype !== 'http://www.w3.org/2001/XMLSchema#string')
          result += '^^<' + value.datatype + '>';

        if (value['xml:lang'])
          result += '@' + value['xml:lang'];

        return result;
      }
      else if (value.type === 'bnode')
        return '_:' + value.value;


      return value.value;
    },
  };

  // Export for use in other modules
  if (typeof module !== 'undefined' && module.exports)
    module.exports = WebMCPTools;
  else if (typeof exports !== 'undefined')
    exports.WebMCPTools = WebMCPTools;
  else if (typeof window !== 'undefined')
    window.WebMCPTools = WebMCPTools;
})(typeof exports !== 'undefined' ? exports : this);

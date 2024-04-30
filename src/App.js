import React, { useState } from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';


const App = () => {
  // State for input values
  const [graphInput, setGraphInput] = useState('');
  const [startNodeInput, setStartNodeInput] = useState('');
  const [endNodeInput, setEndNodeInput] = useState('');
  const [defVariablesInput, setDefVariablesInput] = useState('');
  const [usageVariablesInput, setUsageVariablesInput] = useState('');

  // State for output values
  const [duPairsOutput, setDUPairsOutput] = useState('');
  const [duPathsOutput, setDUPathsOutput] = useState('');
  const [extendedPathsOutput, setExtendedPathsOutput] = useState('');
  const [defCoverageOutput, setDefCoverageOutput] = useState('');
  const [usageCoverageOutput, setUsageCoverageOutput] = useState('');

  // Function to parse input variables
  const parseVariablesInput = input => {
    const variables = {};
    input.split('\n').forEach(line => {
      const parts = line.trim().split(' ');
      const variable = parts.shift();
      variables[variable] = parts.map(Number);
    });
    return variables;
  };

  // Function to parse graph input
  const parseGraphInput = input => {
    const graph = {};
    input.split('\n').forEach(line => {
      const [node1, node2] = line.trim().split(' ').map(Number);
      if (!graph[node1]) {
        graph[node1] = [];
      }
      graph[node1].push(node2);
    });
    return graph;
  };

  // Function to find DU paths for each variable in the graph
  const findDUPaths = (graph, defVariables, usageVariables, startNode, endNodes) => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const results = {};
    for (const variable in defVariables) {
      results[variable] = [];
      for (const start of defVariables[variable]) {
        for (const usageNode of usageVariables[variable]) {
          const visited = {};
          for (const node in graph) {
            visited[node] = false;
          }
          dfs(graph, start, variable, usageNode, visited, [], results);
        }
      }
    }
    return results;
  };

  // Function to calculate DU pairs for each variable in the graph
  const calculateDUPairs = (graph, defVariables, usageVariables) => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const duPairs = {};
    for (const variable in defVariables) {
      duPairs[variable] = [];
      for (const defNode of defVariables[variable]) {
        for (const usageNode of usageVariables[variable]) {
          duPairs[variable].push([defNode, usageNode]);
        }
      }
    }
    return duPairs;
  };

  // Depth-first search to find all paths from start to any usage node of the variable in the graph.
  const dfs = (graph, current, variable, usageNode, visited, path, results) => {
    visited[current] = true;
    path.push(current);
    if (current === usageNode && path.length >= 2) {
      results[variable].push([...path]);
    } else {
      const neighbors = graph[current];
      if (neighbors && Array.isArray(neighbors)) {
        for (const neighbor of neighbors) {
          if (!visited[neighbor] || neighbor === usageNode) {
            dfs(graph, neighbor, variable, usageNode, visited, path, results);
          }
        }
      }
    }
    path.pop();
    visited[current] = false;
  };

  // Function to extend the given path from the start node to the end node if possible
  const extendPath = (graph, startNode, endNode, path) => {
    if (path[0] === startNode && path[path.length - 1] === endNode) {
      return [path];
    }
    if (path.length > 1.3 * Object.keys(graph).length) {
      return [];
    }
    const extendedPaths = [];
    if (path[0] !== startNode) {
      const current = path[0];
      const nextNodes = graph[current] || [];
      for (const nextNode of nextNodes) {
        extendedPaths.push(...extendPath(graph, startNode, endNode, [nextNode, ...path]));
      }
    }
    if (path[path.length - 1] !== endNode) {
      const current = path[path.length - 1];
      const nextNodes = graph[current] || [];
      for (const nextNode of nextNodes) {
        extendedPaths.push(...extendPath(graph, startNode, endNode, [...path, nextNode]));
      }
    }
    return extendedPaths;
  };

  // Function to extend DU paths from start to end nodes
  const extendingDUPathStartToEnd = (graph, startNode, endNode, duPaths) => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const allPaths = {};
    for (const variable in duPaths) {
      allPaths[variable] = [];
      for (const path of duPaths[variable]) {
        allPaths[variable].push(...extendPath(graph, startNode, endNode, path));
      }
    }
    return allPaths;
  };

  // Function to calculate all def coverage
  const calculateAllDefCoverage = (duPaths, defVariables) => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const coveredDefNodes = {};
    for (const variable in defVariables) {
      coveredDefNodes[variable] = new Set();
    }
    const allPaths = [];
    for (const variable in duPaths) {
      for (const path of duPaths[variable]) {
        const nodes = new Set(path);
        for (const node of nodes) {
          if (defVariables[variable].includes(node)) {
            coveredDefNodes[variable].add(node);
          }
        }
        allPaths.push([variable, path]);
        if (coveredDefNodes[variable].size === defVariables[variable].length) {
          break;
        }
      }
    }
    return allPaths;
  };

  // Function to calculate all usage coverage
  const calculateAllUsageCoverage = (duPaths, defVariables, usageVariables) => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const coveredPaths = {};
    for (const variable in usageVariables) {
      coveredPaths[variable] = [];
    }
    const allPaths = [];
    for (const variable in duPaths) {
      for (const path of duPaths[variable]) {
        const defNodesToCover = new Set(defVariables[variable]);
        const usageNodesToCover = new Set(usageVariables[variable]);
        for (const node of path) {
          if (defNodesToCover.has(node)) {
            defNodesToCover.delete(node);
          }
          if (usageNodesToCover.has(node)) {
            usageNodesToCover.delete(node);
          }
        }
        if (defNodesToCover.size === 0 && usageNodesToCover.size === 0) {
          coveredPaths[variable].push([...path]);
        }
        allPaths.push([variable, path]);
      }
    }
    return allPaths;
  };

  // Handlers for each button
  const handleDUPairsClick = () => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const graph = parseGraphInput(graphInput);
    const defVariables = parseVariablesInput(defVariablesInput);
    const usageVariables = parseVariablesInput(usageVariablesInput);
    const duPaths = calculateDUPairs(graph, defVariables, usageVariables);
    setDUPairsOutput(JSON.stringify(duPaths, null, 2));
  };

  const handleDUPathsClick = () => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const graph = parseGraphInput(graphInput);
    const defVariables = parseVariablesInput(defVariablesInput);
    const usageVariables = parseVariablesInput(usageVariablesInput);
    const duPaths = findDUPaths(graph, defVariables, usageVariables, Number(startNodeInput), endNodeInput.split(' ').map(Number));
    setDUPathsOutput(JSON.stringify(duPaths, null, 2));
  };

  const handleExtendedPathsClick = () => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const graph = parseGraphInput(graphInput);
    const duPaths = JSON.parse(duPathsOutput);
    const extendedPaths = extendingDUPathStartToEnd(graph, Number(startNodeInput), Number(endNodeInput), duPaths);
    setExtendedPathsOutput(JSON.stringify(extendedPaths, null, 2));
  };

  const handleDefCoverageClick = () => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const graph = parseGraphInput(graphInput);
    const duPaths = JSON.parse(duPathsOutput);
    const extendedPaths = extendingDUPathStartToEnd(graph, Number(startNodeInput), Number(endNodeInput), duPaths);
    const defVariables = parseVariablesInput(defVariablesInput);
    const defCoverage = calculateAllDefCoverage(extendedPaths, defVariables);
    setDefCoverageOutput(JSON.stringify(defCoverage, null, 2));
  };

  const handleUsageCoverageClick = () => {
    if (!graphInput || !startNodeInput || !endNodeInput || !defVariablesInput || !usageVariablesInput) {
      alert("Please fill in all fields before proceeding.");
      return;
    }
    const graph = parseGraphInput(graphInput);
    const duPaths = JSON.parse(duPathsOutput);
    const extendedPaths = extendingDUPathStartToEnd(graph, Number(startNodeInput), Number(endNodeInput), duPaths);
    const defVariables = parseVariablesInput(defVariablesInput);
    const usageVariables = parseVariablesInput(usageVariablesInput);
    const usageCoverage = calculateAllUsageCoverage(extendedPaths, defVariables, usageVariables);
    setUsageCoverageOutput(JSON.stringify(usageCoverage, null, 2));
  };

  
  // Render input form and output
  return (

    <div className="container mt-5">
      <h1 className="text-center mb-4">Data Flow Coverage Analysis Tool</h1>
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card shadow-lg p-3 mb-5 bg-body rounded">
            <div className="card-body">
              <form>
                <div className="mb-3">
                  <label className="form-label">Graph Edges:</label>
                  <textarea
                    value={graphInput}
                    onChange={(e) => setGraphInput(e.target.value)}
                    className="form-control"
                    placeholder="Enter graph edges (e.g., 1 2)"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Start Node:</label>
                  <input
                    type="text"
                    value={startNodeInput}
                    onChange={(e) => setStartNodeInput(e.target.value)}
                    className="form-control"
                    placeholder="Enter start node"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">End Nodes:</label>
                  <input
                    type="text"
                    value={endNodeInput}
                    onChange={(e) => setEndNodeInput(e.target.value)}
                    className="form-control"
                    placeholder="Enter end nodes separated by spaces"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Definition Variables:</label>
                  <textarea
                    value={defVariablesInput}
                    onChange={(e) => setDefVariablesInput(e.target.value)}
                    className="form-control"
                    placeholder="Enter definition variables and nodes (e.g., a 1 2)"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Usage Variables:</label>
                  <textarea
                    value={usageVariablesInput}
                    onChange={(e) => setUsageVariablesInput(e.target.value)}
                    className="form-control"
                    placeholder="Enter usage variables and nodes (e.g., b 1 3)"
                  />
                </div>
                <div className="d-grid gap-2 d-md-flex justify-content-md-start">
                  <button className="btn btn-primary me-md-2" type="button" onClick={handleDUPairsClick}>Calculate DU Pairs</button>
                  <button className="btn btn-primary me-md-2" type="button" onClick={handleDUPathsClick}>Find DU Paths</button>
                  <button className="btn btn-success me-md-2" type="button" onClick={handleExtendedPathsClick}>DU Path Coverage</button>
                  <button className="btn btn-success me-md-2" type="button" onClick={handleDefCoverageClick}>All Def Coverage</button>
                  <button className="btn btn-success me-md-2" type="button" onClick={handleUsageCoverageClick}>All Usage Coverage</button>
                </div>
                <div class="row">
    <div class="col">{duPairsOutput && <pre className="mt-2">{duPairsOutput}</pre>}</div>
    <div class="col">{duPathsOutput && <pre className="mt-2">{duPathsOutput}</pre>}</div>
    <div class="col">{extendedPathsOutput && <pre className="mt-2">{extendedPathsOutput}</pre>}</div>
    <div class="col">{defCoverageOutput && <pre className="mt-2">{defCoverageOutput}</pre>}</div>
    <div class="col">{usageCoverageOutput && <pre className="mt-2">{usageCoverageOutput}</pre>}</div>
</div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
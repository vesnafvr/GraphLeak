// diffAlgorithm.ts

interface Node {
  id: string;
  type: string;
  attributes: Record<string, any>;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  attributes: Record<string, any>;
}

interface Network {
  nodes: Node[];
  edges: Edge[];
}

interface NetworkDiff {
  addedNodes: Node[];
  removedNodes: Node[];
  modifiedNodes: Array<{
    before: Node;
    after: Node;
    changes: Record<string, {before: any, after: any}>;
  }>;
  addedEdges: Edge[];
  removedEdges: Edge[];
  modifiedEdges: Array<{
    before: Edge;
    after: Edge;
    changes: Record<string, {before: any, after: any}>;
  }>;
}

export function computeNetworkDiff(networkA: Network, networkB: Network): NetworkDiff {
  const diff: NetworkDiff = {
    addedNodes: [],
    removedNodes: [],
    modifiedNodes: [],
    addedEdges: [],
    removedEdges: [],
    modifiedEdges: []
  };

  // Create maps for faster lookups
  const nodeMapA = new Map(networkA.nodes.map(node => [node.id, node]));
  const nodeMapB = new Map(networkB.nodes.map(node => [node.id, node]));
  const edgeMapA = new Map(networkA.edges.map(edge => [edge.id, edge]));
  const edgeMapB = new Map(networkB.edges.map(edge => [edge.id, edge]));

  // Find added and modified nodes
  for (const nodeB of networkB.nodes) {
    const nodeA = nodeMapA.get(nodeB.id);
    if (!nodeA) {
      diff.addedNodes.push(nodeB);
    } else {
      // Check for modifications
      const changes = compareObjects(nodeA.attributes, nodeB.attributes);
      if (nodeA.type !== nodeB.type || Object.keys(changes).length > 0) {
        diff.modifiedNodes.push({
          before: nodeA,
          after: nodeB,
          changes: {
            ...(nodeA.type !== nodeB.type ? { type: { before: nodeA.type, after: nodeB.type } } : {}),
            ...changes
          }
        });
      }
    }
  }

  // Find removed nodes
  for (const nodeA of networkA.nodes) {
    if (!nodeMapB.has(nodeA.id)) {
      diff.removedNodes.push(nodeA);
    }
  }

  // Find added and modified edges
  for (const edgeB of networkB.edges) {
    const edgeA = edgeMapA.get(edgeB.id);
    if (!edgeA) {
      diff.addedEdges.push(edgeB);
    } else {
      // Check for modifications
      const changes = compareObjects(edgeA.attributes, edgeB.attributes);
      if (
        edgeA.source !== edgeB.source ||
        edgeA.target !== edgeB.target ||
        edgeA.type !== edgeB.type ||
        Object.keys(changes).length > 0
      ) {
        diff.modifiedEdges.push({
          before: edgeA,
          after: edgeB,
          changes: {
            ...(edgeA.source !== edgeB.source ? { source: { before: edgeA.source, after: edgeB.source } } : {}),
            ...(edgeA.target !== edgeB.target ? { target: { before: edgeA.target, after: edgeB.target } } : {}),
            ...(edgeA.type !== edgeB.type ? { type: { before: edgeA.type, after: edgeB.type } } : {}),
            ...changes
          }
        });
      }
    }
  }

  // Find removed edges
  for (const edgeA of networkA.edges) {
    if (!edgeMapB.has(edgeA.id)) {
      diff.removedEdges.push(edgeA);
    }
  }

  return diff;
}

function compareObjects(objA: Record<string, any>, objB: Record<string, any>): Record<string, {before: any, after: any}> {
  const changes: Record<string, {before: any, after: any}> = {};
  
  // Check all keys in objA
  for (const key in objA) {
    if (!(key in objB)) {
      changes[key] = { before: objA[key], after: undefined };
      continue;
    }
    
    if (typeof objA[key] === 'object' && objA[key] !== null && typeof objB[key] === 'object' && objB[key] !== null) {
      const nestedChanges = compareObjects(objA[key], objB[key]);
      if (Object.keys(nestedChanges).length > 0) {
        changes[key] = { before: objA[key], after: objB[key] };
      }
    } else if (objA[key] !== objB[key]) {
      changes[key] = { before: objA[key], after: objB[key] };
    }
  }
  
  // Check for keys in objB that aren't in objA
  for (const key in objB) {
    if (!(key in objA)) {
      changes[key] = { before: undefined, after: objB[key] };
    }
  }
  
  return changes;
}
const encoder = new TextEncoder();

type SSEConnections = Map<string, Set<ReadableStreamDefaultController>>;

// Use globalThis to ensure a singleton across Next.js module boundaries
// (server actions and API routes are compiled as separate bundles)
const globalForSSE = globalThis as unknown as {
  __sseConnections?: SSEConnections;
};

if (!globalForSSE.__sseConnections) {
  globalForSSE.__sseConnections = new Map();
}

const connections = globalForSSE.__sseConnections;

export function addConnection(
  userId: string,
  controller: ReadableStreamDefaultController
) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
}

export function removeConnection(
  userId: string,
  controller: ReadableStreamDefaultController
) {
  const set = connections.get(userId);
  if (!set) return;
  set.delete(controller);
  if (set.size === 0) {
    connections.delete(userId);
  }
}

export function broadcast(data: { type: string; payload: unknown }) {
  const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const [, controllers] of connections) {
    for (const controller of controllers) {
      try {
        controller.enqueue(message);
      } catch {
        // Connection closed, will be cleaned up by abort handler
      }
    }
  }
}

export function sendToUser(
  userId: string,
  data: { type: string; payload: unknown }
) {
  const controllers = connections.get(userId);
  if (!controllers) return;
  const message = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  for (const controller of controllers) {
    try {
      controller.enqueue(message);
    } catch {
      // Connection closed
    }
  }
}

exports.findSeatsDFS = (seats, count) => {
  const adj = {};
  seats.forEach(s => (adj[s.seatNumber] = s.adjacent.filter(a => seats.find(x => x.seatNumber === a))));

  const visited = new Set();
  const result = [];

  const dfs = (seat, path) => {
    if (path.length === count) {
      result.push([...path]);
      return;
    }
    visited.add(seat);
    for (const neighbor of adj[seat]) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path, seats.find(s => s.seatNumber === neighbor)]);
      }
    }
    visited.delete(seat);
  };

  for (const s of seats) {
    dfs(s.seatNumber, [s]);
    if (result.length) break;
  }

  return result[0] || null;
};
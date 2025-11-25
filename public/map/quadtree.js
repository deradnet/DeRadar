/**
 * Quadtree Spatial Index for Fast Aircraft Position Queries
 * Optimized for 5000+ aircraft with O(log n) lookups
 */

class Bounds {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  contains(point) {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  intersects(bounds) {
    return !(
      bounds.x > this.x + this.width ||
      bounds.x + bounds.width < this.x ||
      bounds.y > this.y + this.height ||
      bounds.y + bounds.height < this.y
    );
  }
}

class Quadtree {
  constructor(bounds, capacity = 4, maxDepth = 8, depth = 0) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.maxDepth = maxDepth;
    this.depth = depth;
    this.points = [];
    this.divided = false;
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  subdivide() {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;

    const ne = new Bounds(x + w, y, w, h);
    const nw = new Bounds(x, y, w, h);
    const se = new Bounds(x + w, y + h, w, h);
    const sw = new Bounds(x, y + h, w, h);

    this.northeast = new Quadtree(ne, this.capacity, this.maxDepth, this.depth + 1);
    this.northwest = new Quadtree(nw, this.capacity, this.maxDepth, this.depth + 1);
    this.southeast = new Quadtree(se, this.capacity, this.maxDepth, this.depth + 1);
    this.southwest = new Quadtree(sw, this.capacity, this.maxDepth, this.depth + 1);

    this.divided = true;
  }

  insert(point) {
    if (!this.bounds.contains(point)) {
      return false;
    }

    if (this.points.length < this.capacity || this.depth >= this.maxDepth) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    if (this.northeast.insert(point)) return true;
    if (this.northwest.insert(point)) return true;
    if (this.southeast.insert(point)) return true;
    if (this.southwest.insert(point)) return true;

    return false;
  }

  query(range, found = []) {
    if (!this.bounds.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      if (range.contains(point)) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northeast.query(range, found);
      this.northwest.query(range, found);
      this.southeast.query(range, found);
      this.southwest.query(range, found);
    }

    return found;
  }

  queryRadius(center, radius, found = []) {
    const range = new Bounds(
      center.x - radius,
      center.y - radius,
      radius * 2,
      radius * 2
    );

    if (!this.bounds.intersects(range)) {
      return found;
    }

    for (const point of this.points) {
      const dx = point.x - center.x;
      const dy = point.y - center.y;
      const distSq = dx * dx + dy * dy;

      if (distSq <= radius * radius) {
        found.push(point);
      }
    }

    if (this.divided) {
      this.northeast.queryRadius(center, radius, found);
      this.northwest.queryRadius(center, radius, found);
      this.southeast.queryRadius(center, radius, found);
      this.southwest.queryRadius(center, radius, found);
    }

    return found;
  }

  clear() {
    this.points = [];
    this.divided = false;
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }

  getStats() {
    let nodeCount = 1;
    let pointCount = this.points.length;
    let maxDepth = this.depth;

    if (this.divided) {
      const neStats = this.northeast.getStats();
      const nwStats = this.northwest.getStats();
      const seStats = this.southeast.getStats();
      const swStats = this.southwest.getStats();

      nodeCount += neStats.nodeCount + nwStats.nodeCount + seStats.nodeCount + swStats.nodeCount;
      pointCount += neStats.pointCount + nwStats.pointCount + seStats.pointCount + swStats.pointCount;
      maxDepth = Math.max(maxDepth, neStats.maxDepth, nwStats.maxDepth, seStats.maxDepth, swStats.maxDepth);
    }

    return { nodeCount, pointCount, maxDepth };
  }
}

// Export for use in map engine
if (typeof window !== 'undefined') {
  window.Quadtree = Quadtree;
  window.Bounds = Bounds;
}

// Module export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Quadtree, Bounds };
}

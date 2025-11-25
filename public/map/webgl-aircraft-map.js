/**
 * High-Performance WebGL Aircraft Map
 * Handles 5000+ aircraft with GPU-accelerated rendering
 */

class WebGLAircraftMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      onAircraftClick: options.onAircraftClick || (() => {}),
      deviceTier: options.deviceTier || 'medium',
      ...options,
    };

    // Performance limits based on device tier
    this.perfLimits = {
      low: { maxVisible: 500, fps: 15, enableRotation: false, trailPoints: 0 },
      medium: { maxVisible: 2000, fps: 30, enableRotation: true, trailPoints: 5 },
      high: { maxVisible: 10000, fps: 60, enableRotation: true, trailPoints: 10 },
    };
    this.perf = this.perfLimits[this.options.deviceTier];

    // State
    this.map = null;
    this.pixiApp = null;
    this.aircraftContainer = null;
    this.sprites = new Map(); // hex -> sprite
    this.textures = new Map(); // textureKey -> PIXI.Texture
    this.quadtree = null;
    this.lastUpdate = 0;
    this.frameInterval = 1000 / this.perf.fps;
    this.isDestroyed = false;
    this.selectedHex = null;

    this.init();
  }

  async init() {
    try {
      await this.initMap();
      await this.initPixi();
      await this.loadTextures();
      this.initQuadtree();
      this.startRenderLoop();
      console.log('✓ WebGL Aircraft Map initialized');
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  async initMap() {
    // Initialize Leaflet map with dark tiles
    const container = document.getElementById(this.containerId);
    if (!container) throw new Error(`Container #${this.containerId} not found`);

    this.map = L.map(this.containerId, {
      center: [0, 0],
      zoom: 5,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      minZoom: 3,
      subdomains: 'abcd',
    }).addTo(this.map);

    // Add zoom control (bottom right)
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Listen for map events
    this.map.on('moveend', () => this.updateVisibleAircraft());
    this.map.on('zoomend', () => this.updateVisibleAircraft());
  }

  async initPixi() {
    // Get map pane for overlay
    const mapContainer = this.map.getContainer();
    const pane = this.map.getPanes().overlayPane;

    // Create Pixi application
    const { Application } = await import('https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs');

    this.pixiApp = new Application();
    await this.pixiApp.init({
      width: mapContainer.clientWidth,
      height: mapContainer.clientHeight,
      backgroundAlpha: 0,
      antialias: false, // Disable for performance
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    // Add Pixi canvas to map
    pane.appendChild(this.pixiApp.canvas);
    this.pixiApp.canvas.style.position = 'absolute';
    this.pixiApp.canvas.style.top = '0';
    this.pixiApp.canvas.style.left = '0';
    this.pixiApp.canvas.style.pointerEvents = 'auto';

    // Create container for aircraft sprites
    const { Container } = await import('https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs');
    this.aircraftContainer = new Container();
    this.pixiApp.stage.addChild(this.aircraftContainer);

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      this.pixiApp.renderer.resize(
        mapContainer.clientWidth,
        mapContainer.clientHeight
      );
      this.updateVisibleAircraft();
    });
    resizeObserver.observe(mapContainer);

    // Handle click events
    this.aircraftContainer.eventMode = 'static';
    this.aircraftContainer.on('click', (event) => this.handleClick(event));
  }

  async loadTextures() {
    // Load texture converter
    if (!window.AircraftTextures) {
      console.error('AircraftTextures not loaded');
      return;
    }

    // Create all texture variations
    const canvasTextures = window.AircraftTextures.createAllTextures(48);
    const { Texture } = await import('https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs');

    // Convert canvas to Pixi textures
    Object.entries(canvasTextures).forEach(([key, canvas]) => {
      this.textures.set(key, Texture.from(canvas));
    });

    console.log(`✓ Loaded ${this.textures.size} aircraft textures`);
  }

  initQuadtree() {
    // Initialize quadtree for spatial queries
    // World bounds: -180 to 180 lon, -90 to 90 lat
    const bounds = new window.Bounds(-180, -90, 360, 180);
    this.quadtree = new window.Quadtree(bounds, 4, 8);
  }

  startRenderLoop() {
    const render = (timestamp) => {
      if (this.isDestroyed) return;

      // Throttle to target FPS
      if (timestamp - this.lastUpdate >= this.frameInterval) {
        this.updateAircraftPositions();
        this.lastUpdate = timestamp;
      }

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  }

  async updateAircraftData(aircraft) {
    if (!aircraft || !Array.isArray(aircraft)) return;

    // Rebuild quadtree
    this.quadtree.clear();
    aircraft.forEach(ac => {
      if (ac.lat !== undefined && ac.lon !== undefined) {
        this.quadtree.insert({
          x: ac.lon,
          y: ac.lat,
          data: ac,
        });
      }
    });

    // Update visible aircraft
    this.updateVisibleAircraft();
  }

  updateVisibleAircraft() {
    if (!this.map || !this.quadtree) return;

    // Get visible map bounds
    const bounds = this.map.getBounds();
    const queryBounds = new window.Bounds(
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast() - bounds.getWest(),
      bounds.getNorth() - bounds.getSouth()
    );

    // Query visible aircraft
    const visible = this.quadtree.query(queryBounds);

    // Limit by device tier
    const limited = visible.slice(0, this.perf.maxVisible);

    // Update sprites
    this.updateSprites(limited);
  }

  async updateSprites(visibleAircraft) {
    const { Sprite } = await import('https://cdn.jsdelivr.net/npm/pixi.js@8/dist/pixi.min.mjs');
    const currentHexes = new Set();

    visibleAircraft.forEach(point => {
      const aircraft = point.data;
      const hex = aircraft.hex;
      currentHexes.add(hex);

      // Get texture key
      const isSelected = hex === this.selectedHex;
      const textureKey = window.AircraftTextures.getTextureKey(aircraft, isSelected);
      const texture = this.textures.get(textureKey);

      if (!texture) return;

      // Create or update sprite
      let sprite = this.sprites.get(hex);
      if (!sprite) {
        sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.eventMode = 'static';
        sprite.cursor = 'pointer';
        sprite.aircraftData = aircraft;
        this.aircraftContainer.addChild(sprite);
        this.sprites.set(hex, sprite);
      } else {
        // Update texture if changed
        if (sprite.texture !== texture) {
          sprite.texture = texture;
        }
        sprite.aircraftData = aircraft;
      }

      // Update position
      const point = this.map.latLngToContainerPoint([aircraft.lat, aircraft.lon]);
      sprite.x = point.x;
      sprite.y = point.y;

      // Update rotation
      if (this.perf.enableRotation && aircraft.track !== undefined) {
        sprite.angle = aircraft.track;
      }

      // Update scale based on zoom
      const zoom = this.map.getZoom();
      const scale = Math.max(0.3, Math.min(1.5, zoom / 10));
      sprite.scale.set(scale);

      sprite.visible = true;
    });

    // Remove sprites outside viewport
    this.sprites.forEach((sprite, hex) => {
      if (!currentHexes.has(hex)) {
        sprite.visible = false;
      }
    });
  }

  updateAircraftPositions() {
    if (!this.map) return;

    // Update all visible sprite positions (handle map pan)
    this.sprites.forEach(sprite => {
      if (!sprite.visible || !sprite.aircraftData) return;

      const aircraft = sprite.aircraftData;
      const point = this.map.latLngToContainerPoint([aircraft.lat, aircraft.lon]);
      sprite.x = point.x;
      sprite.y = point.y;
    });
  }

  handleClick(event) {
    const sprite = event.target;
    if (sprite && sprite.aircraftData) {
      this.selectedHex = sprite.aircraftData.hex;
      this.options.onAircraftClick(sprite.aircraftData);

      // Update all sprites to refresh selected state
      this.updateVisibleAircraft();
    }
  }

  async centerOnUserLocation() {
    // Use Capacitor Geolocation if available
    if (window.Capacitor && window.Capacitor.Plugins.Geolocation) {
      try {
        const position = await window.Capacitor.Plugins.Geolocation.getCurrentPosition();
        this.map.setView([position.coords.latitude, position.coords.longitude], 8);
      } catch (error) {
        console.error('Failed to get location:', error);
      }
    } else {
      // Fallback to browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            this.map.setView([position.coords.latitude, position.coords.longitude], 8);
          },
          (error) => {
            console.error('Geolocation error:', error);
          }
        );
      }
    }
  }

  destroy() {
    this.isDestroyed = true;

    // Cleanup sprites
    this.sprites.forEach(sprite => sprite.destroy());
    this.sprites.clear();

    // Cleanup textures
    this.textures.forEach(texture => texture.destroy());
    this.textures.clear();

    // Cleanup Pixi
    if (this.pixiApp) {
      this.pixiApp.destroy(true, { children: true, texture: true });
      this.pixiApp = null;
    }

    // Cleanup Leaflet
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    console.log('✓ WebGL Aircraft Map destroyed');
  }
}

// Export for use in React component
if (typeof window !== 'undefined') {
  window.WebGLAircraftMap = WebGLAircraftMap;
}

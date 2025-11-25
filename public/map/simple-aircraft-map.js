/**
 * Simple Leaflet Aircraft Map
 * Optimized for mobile with canvas markers
 */

class SimpleAircraftMap {
  constructor(containerId, options = {}) {
    this.containerId = containerId;
    this.options = {
      onAircraftClick: options.onAircraftClick || (() => {}),
      deviceTier: options.deviceTier || 'medium',
      ...options,
    };

    // Performance limits
    this.perfLimits = {
      low: { maxVisible: 500 },
      medium: { maxVisible: 2000 },
      high: { maxVisible: 5000 },
    };
    this.perf = this.perfLimits[this.options.deviceTier];

    // State
    this.map = null;
    this.markers = new Map(); // hex -> marker
    this.markerLayer = null;
    this.isDestroyed = false;
    this.selectedHex = null;
    this.currentAircraft = [];

    this.init();
  }

  init() {
    try {
      this.initMap();
      console.log('✓ Aircraft Map initialized');
    } catch (error) {
      console.error('Failed to initialize map:', error);
    }
  }

  initMap() {
    const container = document.getElementById(this.containerId);
    if (!container) throw new Error(`Container #${this.containerId} not found`);

    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
      throw new Error('Leaflet not loaded');
    }

    this.map = L.map(this.containerId, {
      center: [40, -95],
      zoom: 4,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    // CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      minZoom: 2,
      subdomains: 'abcd',
    }).addTo(this.map);

    // Add zoom control (bottom right)
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    // Create marker layer
    this.markerLayer = L.layerGroup().addTo(this.map);
  }

  createAircraftIcon(aircraft, isSelected) {
    const color = this.getAircraftColor(aircraft, isSelected);
    const heading = aircraft.track || 0;

    // Simple SVG airplane icon
    const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" style="transform: rotate(${heading}deg)">
        <path d="M12 2L4 20L12 17L20 20L12 2Z" fill="${color}" stroke="#000" stroke-width="0.5" opacity="0.9"/>
      </svg>
    `;

    return L.divIcon({
      html: svgIcon,
      className: 'aircraft-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  getAircraftColor(aircraft, isSelected) {
    if (isSelected) return '#00FF00'; // Green
    if (aircraft.emergency && aircraft.emergency !== 'none') return '#FF4444'; // Red
    if ((aircraft.alt_baro || 0) < 100) return '#888888'; // Gray (ground)
    if ((aircraft.alt_baro || 0) > 35000) return '#00AAFF'; // Blue (high)
    if ((aircraft.gs || 0) > 400) return '#FF8800'; // Orange (fast)
    return '#FFD700'; // Gold (default)
  }

  updateAircraftData(aircraft) {
    if (!aircraft || !Array.isArray(aircraft) || !this.map) return;

    this.currentAircraft = aircraft;

    // Get visible bounds
    const bounds = this.map.getBounds();

    // Filter aircraft in viewport
    const visibleAircraft = aircraft
      .filter(a =>
        a.lat !== undefined &&
        a.lon !== undefined &&
        bounds.contains([a.lat, a.lon])
      )
      .slice(0, this.perf.maxVisible);

    // Track current hexes
    const currentHexes = new Set(visibleAircraft.map(a => a.hex));

    // Update/create markers
    visibleAircraft.forEach(ac => {
      const hex = ac.hex;
      const isSelected = hex === this.selectedHex;

      let marker = this.markers.get(hex);

      if (!marker) {
        // Create new marker
        marker = L.marker([ac.lat, ac.lon], {
          icon: this.createAircraftIcon(ac, isSelected),
        });

        marker.aircraftData = ac;
        marker.on('click', () => {
          this.selectedHex = hex;
          this.options.onAircraftClick(ac);
          this.updateMarkers();
        });

        marker.addTo(this.markerLayer);
        this.markers.set(hex, marker);
      } else {
        // Update existing marker
        marker.setLatLng([ac.lat, ac.lon]);
        marker.setIcon(this.createAircraftIcon(ac, isSelected));
        marker.aircraftData = ac;
      }
    });

    // Remove markers outside viewport
    this.markers.forEach((marker, hex) => {
      if (!currentHexes.has(hex)) {
        marker.remove();
        this.markers.delete(hex);
      }
    });

    console.log(`Map: ${this.markers.size} visible aircraft of ${aircraft.length} total`);
  }

  updateMarkers() {
    // Refresh all markers (for selection state)
    this.markers.forEach((marker, hex) => {
      const ac = marker.aircraftData;
      if (ac) {
        const isSelected = hex === this.selectedHex;
        marker.setIcon(this.createAircraftIcon(ac, isSelected));
      }
    });
  }

  centerOnUserLocation() {
    if (window.Capacitor && window.Capacitor.Plugins.Geolocation) {
      window.Capacitor.Plugins.Geolocation.getCurrentPosition()
        .then(position => {
          this.map.setView(
            [position.coords.latitude, position.coords.longitude],
            8
          );
        })
        .catch(error => console.error('Geolocation error:', error));
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.map.setView(
            [position.coords.latitude, position.coords.longitude],
            8
          );
        },
        error => console.error('Geolocation error:', error)
      );
    }
  }

  destroy() {
    this.isDestroyed = true;

    // Remove all markers
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();

    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    console.log('✓ Aircraft Map destroyed');
  }
}

// Export for use in React component
if (typeof window !== 'undefined') {
  window.SimpleAircraftMap = SimpleAircraftMap;
}

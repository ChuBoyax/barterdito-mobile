import { Compass, Minus, Plus } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { AppText, PressableScale } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { neu } from '@/theme';

/** Listings sharing one public profile area get a single pin. */
export type MapArea = { key: string; latitude: number; longitude: number; count: number };

type NearbyMapProps = {
  center: { latitude: number; longitude: number };
  radiusKm: number;
  areas: MapArea[];
  selected: string | null;
  onSelect: (key: string | null) => void;
};

/**
 * Same map as the website: Leaflet with OpenStreetMap tiles (no API key), in a WebView.
 * Pins are traders' approximate profile areas; exact meetups are agreed in chat.
 */
const html = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{margin:0;height:100%;background:#e8efe3}.leaflet-control-attribution{font-size:9px}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const send = (message) => window.ReactNativeWebView.postMessage(JSON.stringify(message));
const map = L.map('map', { zoomControl: false, minZoom: 2, maxZoom: 19 }).setView([12.88, 121.77], 5);
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19, noWrap: true, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
tiles.on('tileerror', () => send({ type: 'tileError' }));
const zone = L.featureGroup().addTo(map), pins = L.layerGroup().addTo(map);
map.on('click', () => send({ type: 'select', key: null }));
const pin = (count, active) => '<svg width="38" height="46" viewBox="0 0 38 46"><path d="M19 44C15 38 2 26 2 19a17 17 0 0 1 34 0c0 7-13 19-17 25Z" fill="' +
  (active ? '#DB5200' : '#FF6E00') + '" stroke="white" stroke-width="3"/>' + (count > 1
  ? '<text x="19" y="24" text-anchor="middle" fill="white" font-family="sans-serif" font-size="14" font-weight="700">' + count + '</text>'
  : '<circle cx="19" cy="19" r="7" fill="white"/>') + '</svg>';
window.fit = () => { if (zone.getLayers().length) map.fitBounds(zone.getBounds(), { padding: [20, 20], maxZoom: 13, animate: false }); };
window.zoom = (step) => map.setZoom(map.getZoom() + step);
window.update = (state) => {
  zone.clearLayers(); pins.clearLayers();
  const centre = [state.center.latitude, state.center.longitude];
  L.circle(centre, { radius: state.radiusKm * 1000, color: '#174EA6', weight: 1, fillOpacity: 0.04, interactive: false }).addTo(zone);
  L.circleMarker(centre, { radius: 7, color: 'white', weight: 3, fillColor: '#174EA6', fillOpacity: 1, interactive: false }).addTo(zone);
  if (state.fit) window.fit();
  state.areas.forEach((area) => L.marker([area.latitude, area.longitude], {
    icon: L.divIcon({ className: '', iconSize: [38, 46], iconAnchor: [19, 44], html: pin(area.count, area.key === state.selected) }),
  }).on('click', (event) => { L.DomEvent.stopPropagation(event); send({ type: 'select', key: area.key }); }).addTo(pins));
};
send({ type: 'ready' });
</script></body></html>`;

export function NearbyMap({ center, radiusKm, areas, selected, onSelect }: NearbyMapProps) {
  const { colors } = useTheme();
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  // Re-fit only when the circle itself changes, not when pins or the selection do.
  const fitted = useRef('');

  useEffect(() => {
    if (!ready) return;
    const circle = `${center.latitude}:${center.longitude}:${radiusKm}`;
    const state = { center, radiusKm, areas, selected, fit: fitted.current !== circle };
    fitted.current = circle;
    web.current?.injectJavaScript(`window.update(${JSON.stringify(state)}); true;`);
  }, [ready, center, radiusKm, areas, selected]);

  function onMessage(event: WebViewMessageEvent) {
    const message = JSON.parse(event.nativeEvent.data) as { type: string; key?: string | null };
    if (message.type === 'ready') setReady(true);
    if (message.type === 'tileError') setTileError(true);
    if (message.type === 'select') onSelect(message.key ?? null);
  }

  const run = (script: string) => web.current?.injectJavaScript(`${script}; true;`);

  return (
    <View style={[styles.map, { backgroundColor: colors.mapLand }, neu(colors, 2)]}>
      <WebView
        ref={web}
        source={{ html }}
        originWhitelist={['*']}
        onMessage={onMessage}
        javaScriptEnabled
        scrollEnabled={false}
        style={styles.web}
        accessibilityLabel="Nearby trades map"
      />
      <View style={styles.controls}>
        <MapButton label="Zoom in" icon={Plus} onPress={() => run('window.zoom(1)')} />
        <MapButton label="Zoom out" icon={Minus} onPress={() => run('window.zoom(-1)')} />
        <MapButton label="Recenter on your profile location" icon={Compass} onPress={() => run('window.fit()')} />
      </View>
      {tileError ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setTileError(false);
            web.current?.reload();
            setReady(false);
            fitted.current = '';
          }}
          style={[styles.tileError, { backgroundColor: colors.surface }]}>
          <AppText variant="caption" color="ink">
            Map tiles could not load. Listings are still below.{' '}
            <AppText variant="caption" color="orange" weight="bold">
              Retry map
            </AppText>
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function MapButton({ label, icon: Icon, onPress }: { label: string; icon: typeof Plus; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} scaleTo={0.9} style={[styles.button, { backgroundColor: colors.surface }, neu(colors, 1)]}>
      <Icon size={18} color={colors.ink} strokeWidth={2.2} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  map: { height: 340, borderRadius: 28, overflow: 'hidden' },
  web: { flex: 1, backgroundColor: 'transparent' },
  controls: { position: 'absolute', top: 12, right: 12, gap: 8 },
  button: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileError: { position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 14, padding: 10 },
});

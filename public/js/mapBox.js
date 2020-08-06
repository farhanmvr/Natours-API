/* eslint-disable */

export const displayMap = (locations) => {
   mapboxgl.accessToken =
      'pk.eyJ1IjoiZmFyaGFueGF2aW8iLCJhIjoiY2tkZmpwM3BxMTR0bTJ0cXFlZGU1eGFrdSJ9.FmIvUMlEwgJm5yt7xLVeFQ';
   var map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/farhanxavio/ckdfkewxt0k0x1iqrunrdezzz',
      scrollZoom: false,
      // center: [-118.113491, 34.111745], // lng,lat
      // zoom: 4,
      // interactive: false,
   });

   const bounds = new mapboxgl.LngLatBounds();

   locations.forEach((loc) => {
      // Create marker
      const el = document.createElement('div');
      el.className = 'marker';
      // Add marker
      new mapboxgl.Marker({
         element: el,
         anchor: 'bottom',
      })
         .setLngLat(loc.coordinates)
         .addTo(map);
      // Add popup
      new mapboxgl.Popup({
         offset: 30,
      })
         .setLngLat(loc.coordinates)
         .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
         .addTo(map);
      // Extends map bounds to include the current location
      bounds.extend(loc.coordinates);
   });

   map.fitBounds(bounds, {
      padding: {
         top: 200,
         bottom: 150,
         left: 100,
         right: 100,
      },
   });
};

import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Correction pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MissionMap = ({ mission }) => {
  const center = {
    lat: mission?.adresse_pickup?.latitude || 48.8566,
    lng: mission?.adresse_pickup?.longitude || 2.3522
  };

  return (
    <MapContainer 
      center={[center.lat, center.lng]} 
      zoom={12} 
      style={{ height: '400px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {mission?.adresse_pickup && (
        <Marker 
          position={[
            mission.adresse_pickup.latitude,
            mission.adresse_pickup.longitude
          ]}
        >
          <Popup>Point de départ</Popup>
        </Marker>
      )}

      {mission?.adresse_delivery && (
        <Marker 
          position={[
            mission.adresse_delivery.latitude,
            mission.adresse_delivery.longitude
          ]}
        >
          <Popup>Point d'arrivée</Popup>
        </Marker>
      )}

      {mission?.adresse_pickup && mission?.adresse_delivery && (
        <Polyline 
          positions={[
            [mission.adresse_pickup.latitude, mission.adresse_pickup.longitude],
            [mission.adresse_delivery.latitude, mission.adresse_delivery.longitude]
          ]}
          color="blue"
        />
      )}
    </MapContainer>
  );
};

export default MissionMap; 